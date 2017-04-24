const config = require('cheevr-config');
const Database = require('cheevr-database');
const Logger = require('cheevr-logging');
const path = require('path');
const Worker = require('./worker');


const log = Logger[config.tasks.logger];
const db = Database.factory(config.tasks.database);
const hostname = require('os').hostname();

/**
 * Holds information about one tasks with all its workers
 */
class Task {
    constructor(file) {
        this._file = file;
        this._name = path.basename(this.file, path.extname(this.file));
        this._workers = [];

        this.broadcast = new Proxy(this, {
            get: (obj, method) => {
                return (...args) => {
                    let promises = [];
                    for (let worker of obj.workers) {
                        promises.push(worker[method](...args));
                    }
                    return Promise.all(promises);
                }
            }
        });
        let idx = 0;
        this.roundRobin = new Proxy(this, {
            get: (obj, method) => {
                return (...args) => {
                    if (!obj.workers.length) {
                        return;
                    }
                    idx = (idx + 1) % obj.workers.length;
                    return obj.workers[idx][method](...args);
                }
            }
        });

        this.ready = () => new Promise(resolve => {
            db.get({
                index: config.tasks.index,
                type: 'task',
                id: hostname + '#' + this.name
            }, (err, result) => {
                if (err || !result._source) {
                    this._enabled = true;
                    this.workersWanted = 1;
                    db.create({
                        index: config.tasks.index,
                        type: 'task',
                        id: hostname + '#' + this.name,
                        refresh: true,
                        ignore: 409, // already exists
                        body: {
                            file: this.file,
                            host: hostname,
                            workers: 1,
                            enabled: this.enabled
                        }
                    }, err => resolve());
                } else {
                    this._enabled = result._source.enabled;
                    this.workersWanted = result._source.workers;
                    resolve();
                }
            });
        });
    }

    /**
     * Sets this task to be enabled or disabled. The state is saved in the database so that a restart will maintain
     * this settings
     * @param {boolean} enabled
     */
    set enabled(enabled) {
        if (this._enabled !== enabled) {
            this._enabled = enabled;
            if (enabled) {
                this.workersWanted = this._workersWanted;
            } else {
                this._workers.map(worker => worker.kill());
                this._workers = [];
            }
            db.update({
                index: config.tasks.index,
                type: 'task',
                id: hostname + '#' + this.name,
                body: { doc: { enabled }}
            });
        }
    }

    /**
     * Returns whether this task has been enabled or not.
     * @returns {boolean}
     */
    get enabled() {
        return this._enabled;
    }

    get id() {
        return this.file;
    }

    get file() {
        return this._file;
    }

    get name() {
        return this._name;
    }

    get workers() {
        return this._workers;
    }

    get workersWanted() {
        return this._workersWanted;
    }

    set workersWanted(count) {
        this._workersWanted = count;
        db.update({
            index: config.tasks.index,
            type: 'task',
            id: hostname + '#' + this.name,
            body: { doc: { workers: count } }
        });
        if (this._enabled) {
            for (let nr = this._workers.length; nr <= count; nr++) {
                this.addWorker();
            }
            for (let nr = this._workers.length; nr > count; nr--) {
                this.removeWorker();
            }
        }
    }

    addWorker() {
        let worker = new Worker(this);
        worker._runner._childProcess.on('message', payload => {
            if (this[payload.method]) {
                payload.args = Array.isArray(payload.args) ? payload.args : [ payload.args ];
                this[payload.method](worker, ...payload.args);
            }
        });
        this._workers.push(worker);
        return worker;
    }

    removeWorker() {
        let worker = this._workers.pop();
        if (!worker) {
            return log.warn('Trying to stop worker for task "%s", when there are no more workers running', task.name);
        }
        worker.kill();
    }

    worker(id) {
        for (let worker of this._workers) {
            if (worker.id === id) {
                return worker;
            }
        }
    }


    /*********************
     *
     * These methods can be called from anywhere, but are mainly used by the runner to update the task manager.
     * The first argument (the worker) is bound automatically when called by a runner.
     *
     */

    /**
     * Receives any error messages from the job runner
     * @param {Worker} worker   The worker id form which the message came
     * @param {string} message  An error message
     * @param {string} [stack]  A printable stack
     */
    error(worker, message, stack) {
        log.error('Error in worker "%s", task "%s": %s', worker.id, this.name, message);
        stack && log.error(stack);
    }

    /**
     * Sets the state of any worker.
     * @param {Worker} worker   The worker id form which the message came
     * @param {string} jobId    The job id
     * @param {string} state    The state the worker is currently in
     */
    state(worker, jobId, state) {
        // Reminder: states are only kept in memory
        worker.setState(jobId, state);
    }

    /**
     * Allows to set the number of workers a task should be running on. Will either spawn or kill additional processes.
     * @param {Worker} worker   The worker id form which the message came
     * @param {number} count    The number of workers we want to have running
     */
    setWorkers(worker, count) {
        this.workersWanted = count;
    }
}

module.exports = Task;

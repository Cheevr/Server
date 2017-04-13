const config = require('cheevr-config');
const Database = require('cheevr-database');
const path = require('path');


const db = Database.factory(config.tasks.database);
const hostname = require('os').hostname();

/**
 * Holds information about one tasks with all its workers
 */
class Task {
    constructor(file, workersWanted = 1, enabled = true) {
        this._file = file;
        this._name = path.basename(this.file, path.extname(this.file));
        this._workers = [];
        this._workersWanted = workersWanted;
        this._enabled = enabled;
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
    }

    /**
     * Sets this task to be enabled or disabled. The state is saved in the database so that a restart will maintain
     * this settings
     * @param {boolean} enabled
     */
    set enabled(enabled) {
        if (this._enabled !== enabled) {
            for (let worker of this.workers) {
                worker.enabled = enabled;
            }
            db.update({
                index: config.tasks.index,
                type: 'task',
                id: hostname + '#' + this.name,
                body: { doc: { enabled }}
            });
        }
        this._enabled = enabled;
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
        db.update({
            index: config.tasks.index,
            type: 'task',
            id: hostname + '#' + this.name,
            body: { doc: { workers: count } }
        });
        this._workersWanted = count;
    }

    worker(id) {
        for (let worker of this.workers) {
            if (worker.id === id) {
                return worker;
            }
        }
    }
}

module.exports = Task;

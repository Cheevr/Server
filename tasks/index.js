const config = require('cheevr-config');
const fork = require('fork-require');
const fs = require('fs');
const Logger = require('cheevr-logging');
const path = require('path');
const shortId = require('shortid');
const Task = require('./task');


const cwd = process.cwd();
const log = Logger.tasks;


/**
 * Holds information about all the tasks
 */
class TaskManager {
    constructor() {
        this._tasks = {};
        this._workers = {};

        let taskDirs = config.normalizePath(cwd, config.paths.tasks);
        for (let dir of taskDirs) {
            if (fs.existsSync(dir)) {
                if (fs.statSync(dir).isDirectory()) {
                    let files = fs.readdirSync(dir);
                    for (let file of files) {
                        let fullPath = path.join(dir, file);
                        this.addTask(fullPath);
                    }
                } else {
                    this.addTask(dir);
                }
            }
        }
    }

    addTask(file) {
        try {
            let taskName = path.basename(file, path.extname(file));
            this._tasks[taskName] = this._tasks[taskName] || new Task(file);
            let workerNumber = this._getWorkerNumber(taskName);
            let workerId = shortId.generate();

            let worker = fork('./runner.js', { args: [process.title, workerId, file] });
            worker.task = taskName;
            worker.file = file;
            worker.number = workerNumber;
            worker.id = workerId;

            worker._childProcess.on('message', payload => {
                if (this[payload.method]) {
                    payload.args = Array.isArray(payload.args) ? payload.args : [ payload.args ];
                    this[payload.method].call(this, workerId, ...payload.args);
                }
            });
            this._workers[workerId] = worker;
            this._tasks[taskName].workers.push(worker);
            return worker.task;
        } catch (e) {
            log.warn('Unable to load task(s) %s:\n%s', file, e.toString(), e.stack);
        }
    }

    _getWorkerNumber(task) {
        return this._tasks[task].workers.length + 1
    }

    /**
     * Returns the worker proxy for the given worker ID.
     * @param {string} workerId
     * @returns {Proxy}
     */
    worker(workerId) {
        return this._workers[workerId];
    }

    /**
     * Returns an array of all workers for a given tasks ID.
     * @param {string} taskId
     * @returns {Task}
     */
    task(taskId) {
        return this._tasks[taskId];
    }

    /*********************
     *
     * These methods can be called from anywhere, but are mainly used by the runner to update the task manager.
     *
     */

    /**
     * Receives any error messages from the job runner
     * @param {string} id       The worker id form which the message came
     * @param {string} message  An error message
     * @param {string} [stack]  A printable stack
     */
    error(id, message, stack) {
        log.error('Error in worker "%s": %s', this._workers[id].task, message);
        stack && log.error(stack);
    }

    /**
     * Allows to change the configuration for any job to be set. Allows to trigger a configuration update for a worker.
     * An optional configuration file can be given for default values, but rest of config will be fetched from db.
     * @param {string} id       The worker id
     * @param {Object} [config] The configuration object
     */
    config(id, config) {
        // TODO fetch config from database and only fill values that are not set yet
        let worker = this._workers[id];
        worker.config = config;
        if (this._tasks[worker.task].length < config.workers) {
            setImmediate(() => this.addTask(worker.file));
        }
    }

    /**
     * Sets the state of any worker.
     * @param {string} id       The job id
     * @param {string} state    The state the worker is currently in
     */
    state(id, state) {
        this._workers[id].state = state;
        // -> TODO store job with state in database
    }
}


module.exports = exports = new TaskManager();

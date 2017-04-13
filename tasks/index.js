const config = require('cheevr-config');
const Database = require('cheevr-database');
const fork = require('fork-require');
const fs = require('fs');
const Logger = require('cheevr-logging');
const path = require('path');
const Task = require('./task');
const Worker = require('./worker');


const cwd = process.cwd();
const hostname = require('os').hostname();
const log = Logger[config.tasks.logger];
const db = Database.factory(config.tasks.database);

/**
 * Holds information about all the tasks
 */
class TaskManager {
    constructor() {
        this._tasks = {};
        this.workers = {};
        let taskDirs = config.normalizePath(cwd, config.paths.tasks);
        Database.ready && this.scanPath(taskDirs) || Database.on('ready', () => this.scanPath(taskDirs));
    }

    /**
     * Looks at the given path for javascript files to include and creates task processes for them.
     * @param {string|string[]} taskPath    The file or directory to create a task off of
     */
    scanPath(taskPath) {
        taskPath = Array.isArray(taskPath) ? taskPath : [ taskPath ];
        for (let dir of taskPath) {
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

    /**
     * Will create a new task with one or more associated runners that will execute the jobs inside the task.
     * @param {string} file The task file that should be added.
     * @returns {Task} A task object that allows to send messages to one or more workers
     */
    async addTask(file) {
        file = path.normalize(file);
        let taskName = path.basename(file, path.extname(file));
        let task = this._tasks[file];
        if (!task) {
            try {
                let result = await db.get({
                    index: config.tasks.index,
                    type: 'task',
                    id: hostname + '#' + taskName
                });
                this._tasks[file] = task = new Task(file, result._source.workers, result._source.enabled);
            } catch (err) {
                task = new Task(file)
            }
        }

        let worker = new Worker(task, file);
        worker.on('message', payload => {
            if (this[payload.method]) {
                payload.args = Array.isArray(payload.args) ? payload.args : [ payload.args ];
                this[payload.method].call(this, worker, ...payload.args);
            }
        });
        this.workers[worker.id] = worker;
        task.workers.push(worker);

        await db.create({
            index: config.tasks.index,
            type: 'task',
            id: hostname + '#' + task.name,
            refresh: true,
            ignore: 409, // already exists
            body: {
                file: task.file,
                host: hostname,
                workers: 1,
                enabled: true
            }
        });

        await this.setWorkers(worker, task.workersWanted);
        return task;
    }

    /**
     * Kills a currently running worker for a task.
     * @param task
     */
    removeWorker(task) {
        let worker = task.workers.pop();
        if (!worker) {
            return log.warn('Trying to stop worker for task "%s", when there are no more workers running', task.name);
        }
        worker.kill();
        delete this.workers[worker.id];
        this._tasks[task.file].workers.filter(entry => entry !== worker);
    }

    /**
     * Returns the worker proxy for the given worker ID.
     * @param {string} workerId
     * @returns {Proxy}
     */
    worker(workerId) {
        return this.workers[workerId];
    }

    /**
     * Returns an array of all workers for a given tasks file.
     * @param {string} file The filename (same as task.id) that identifies this task.
     * @returns {Task}
     */
    task(file) {
        return this._tasks[file];
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
        log.error('Error in worker "%s", task "%s": %s', worker.id, worker.task.name, message);
        stack && log.error(stack);
    }

    /**
     * Sets the state of any worker.
     * @param {Worker} worker   The worker object
     * @param {string} job      The job id
     * @param {string} state    The state the worker is currently in
     */
    state(worker, job, state) {
        // Reminder: states are only kept in memory
        // TODO states need to be per job
        worker.state[job] = state;
    }

    /**
     * Allows to set the number of workers a task should be running on. Will either spawn or kill additional processes.
     * @param {Worker} worker
     * @param {number} count
     */
    async setWorkers(worker, count) {
        let current = worker.task.workers.length;
        worker.task.workersWanted = count;
        if (current < count) {
            setImmediate(() => this.addTask(worker.file));
        }
        if (current > count) {
            setImmediate(() => this.removeWorker(worker.task));
        }
    }
}


module.exports = exports = new TaskManager();

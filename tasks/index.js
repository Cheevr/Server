const config = require('cheevr-config');
const Database = require('cheevr-database');
const fs = require('fs');
const Logger = require('cheevr-logging');
const path = require('path');
const Task = require('./task');


const cwd = process.cwd();
const log = Logger[config.tasks.logger];

/**
 * Holds information about all the tasks. The hierarchy is as follows:
 *
 * TaskManager > Tasks      The task manager holds all top level tasks
 * Task > Workers           Each tasks can be executed in parallel with multiple workers
 * Worker <> Runner         Each worker has one runner that it communicates with
 * Runner > Jobs            Each runner can execute multiple jobs at independent intervals (depending on the type of job)
 */
class TaskManager {
    constructor() {
        this._tasks = {};
        let taskDirs = config.normalizePath(cwd, config.paths.tasks);
        Database.ready && this.scanPath(taskDirs) || Database.on('ready', () => this.scanPath(taskDirs));
    }

    /**
     * Looks at the given path for javascript files to include and creates task processes for them.
     * @param {string|string[]} taskPath    The file or directory to create a task off of
     */
    scanPath(taskPath) {
        if (!config.tasks.enabled) {
            return;
        }
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
        if (!config.tasks.enabled) {
            return;
        }
        file = path.normalize(file);
        let task = this._tasks[file];
        if (!task) {
            this._tasks[file] = task = new Task(file);
        }
        await task.ready();
        return task;
    }

    /**
     * Sets up a status api for tasks.
     * @param {express.router} router   The express router (or a compatible implementation)
     * @param {string} [urlPath]        The path prefix under which the status api should be accessible
     */
    endpoint(router, urlPath = config.tasks.urlPath) {
        if (config.tasks.enabled) {
            router.get(urlPath + '/status', (req, res) => {
                let response = {};
                for (let file in this._tasks) {
                    let task = this._tasks[file];
                    let workers = {};
                    for (let worker of task.workers) {
                        // TODO workers are set to be enabled:false (when they are not)
                        workers[worker.id] = worker.state;
                    }
                    response[task.name] = {
                        workers,
                        enabled: task.enabled
                    }
                }
                res.jsonp(response).end();
            });
            router.get(urlPath + '/:taskName/enable', (req, res, next) => {
                for (let file in this._tasks) {
                    if (file.endsWith(req.params.taskName)) {
                        this._tasks[file].enabled = true;
                        log.info('Set task "%s" to be enabled', req.params.taskName);
                        return res.status(204).end();
                    }
                }
                next();
            });
            router.get(urlPath + '/:taskName/disable', (req, res, next) => {
                for (let file in this._tasks) {
                    if (file.endsWith(req.params.taskName)) {
                        log.info('Set task "%s" to be disabled', req.params.taskName);
                        this._tasks[file].enabled = false;
                        return res.status(204).end();
                    }
                }
                next();
            });
            router.get(urlPath + '/:taskName/workers/:count', (req, res, next) => {
                for (let file in this._tasks) {
                    if (file.endsWith(req.params.taskName)) {
                        log.info('Set number of workers for task "%s" to %s', req.params.taskName, req.params.count);
                        this._tasks[file].workersWanted = req.params.count;
                        return res.status(204).end();
                    }
                }
                next();
            });
            router.get(urlPath + '/:taskName/trigger/:jobName', (req, res, next) => {
                for (let file in this._tasks) {
                    if (file.endsWith(req.params.taskName)) {
                        this._tasks[file].roundRobin._runJob(req.params.jobName);
                        log.info('Manually triggered job "%s" in task "%s"', req.params.jobName, req.params.taskName);
                        return res.status(204).end();
                    }
                }
                next();
            });
        }
    }

    /**
     * Returns an array of all workers for a given tasks file.
     * @param {string} file The filename (same as task.id) that identifies this task.
     * @returns {Task}
     */
    task(file) {
        return this._tasks[file];
    }
}


module.exports = exports = new TaskManager();

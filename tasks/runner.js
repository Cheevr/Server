const _ = require('lodash');
const config = require('cheevr-config').addDefaultConfig(__dirname, '../config');
const later = require('later');
const Logger = require('cheevr-logging');
const moment = require('moment');
const path = require('path');


const log = Logger[config.tasks.logger];
const momentRegexp = /(\d+)(.*)/;
const appTitle = process.argv[2];
const workerId = process.argv[3];
const taskFile = process.argv[4];
const taskName = path.basename(taskFile, path.extname(taskFile));
const task = require(taskFile);

function send(message, retries = 0) {
    try {
        process.send(message);
    } catch (err) {
        retries < 3 && setImmediate(() => send(message, ++retries));
    }
}

class Runner {
    constructor() {
        this._jobs = {};
        this._cluster = new Proxy({}, {
            get: (_, method) => (...args) => send({ method, args })
        });
        task(this);
    }

    /**
     * An alias for {@link Runner#workers}.
     * @param {number} count
     * @see Runner#workers
     */
    set worker(count) {
        this.workers = count;
    }

    /**
     * Allows the job configurator to set how many workers should be running a task.
     * @param {number} count    The number of workers that should be running.
     */
    set workers(count) {
        this._cluster.setWorkers(count);
    }

    /**
     * Enabled or disables this runners jobs.
     * @param enabled
     */
    enable(enabled) {
        // TODO enable or disable this task
        console.log('setting worker/runner to be', enabled ? 'enabled' : 'disabled');
    }

    /**
     * Allows a developer to register a new job in a task file.
     * @param {object} jobConfig    The job configuration
     * @param {function} executor   The actual job to run
     */
    job(jobConfig, executor) {
        if (!jobConfig.name) {
            throw new Error('Please give your job a unique name');
        }
        if (this._jobs[jobConfig.name]) {
            throw new Error('A job with the given name [' + jobConfig.name + '] has already been configured')
        }

        _.defaultsDeep(jobConfig, config.defaults.tasks);

        if (jobConfig.interval) {
            jobConfig.interval = Runner._toInterval(jobConfig.interval);
        }
        if (jobConfig.sleep) {
            jobConfig.sleep = Runner._toInterval(jobConfig.sleep);
        }
        if (jobConfig.cron) {
            jobConfig.cron = later.parse.test(jobConfig.cron);
        }

        let id = jobConfig.name;
        this._jobs[id] = {config: jobConfig, executor};
        this._jobs[id].timeout = setTimeout(this._runJob.bind(this, id), this._timeToNextRun(id));
        this._setState(id, 'idle');
    }

    /**
     * Will try to convert the incoming value to a ms interval number.
     * @param {*} val
     * @returns {number}
     * @private
     */
    static _toInterval(val) {
        switch(typeof val) {
            case 'string':
                let args = momentRegexp.exec(val).splice(1);
                args[0] = parseInt(args);
                return moment.duration(...args).asMilliseconds();
            case 'number': return val;
            default: return moment.duration(val).asMilliseconds();
        }
    }

    /**
     * Returns the time (ms) until the next job of this id should run.
     * @param {string} id   The job id to check for.
     * @returns {number}
     * @private
     */
    _timeToNextRun(id) {
        let job = this._jobs[id];
        if (job.config.interval !== undefined) {
            let lastRun = job.lastRun || 0;
            return Math.max(lastRun - Date.now() + job.config.interval, job.config.sleep);
        }
        if (job.config.cron !== undefined) {
            // TODO support cron format
        }
        throw new Error('No configuration found for next job run interval')
    }

    _runJob(id) {
        let job = this._jobs[id];
        clearTimeout(job.timeout);

        if (job.config.interval) {
            // if a job is running it will trigger a new run once it's done on intervals or just skip it if it's
            if (job.state === 'running' && !job.config.allowOverlaps) {
                return;
            }
            if (!job.config.waitForComplete) {
                job.lastRun = Date.now();
            }
            this._setState(id, 'running');
            let now = moment();
            new Promise((resolve, reject) => {
                // TODO add database, metrics & mq to context
                log.debug('Job "%s" in task "%s" has started', id, taskName);
                job.executor({resolve, reject});
            }).then(() => {
                if (job.config.waitForComplete) {
                    job.lastRun = Date.now();
                }
                let timeToNextRun = this._timeToNextRun(id);
                let end = moment.duration(moment().diff(now));
                log.debug('Job "%s" in task "%s" finished within %s, next run in', id, taskName, end.humanize(), moment.duration(timeToNextRun).humanize());
                this._setState(id, 'idle');
                job.timeout = setTimeout(this._runJob.bind(this, id), timeToNextRun);
            }).catch(err => {
                log.error('Error running job', err.stack || err.toString());
                // TODO retry logic && timeouts
                this._setState(id, 'error');
            });
        }

        if (job.config.cron) {
            if (job.state === 'running' && !job.config.allowOverlaps) {
                return log.warn('Skipping job ' + id + ' because the previous run is still active');
            }
            // TODO handle cron format
        }
    }

    _setState(id, state) {
        this._jobs[id].state = state;
        this._cluster.state(id, state);
    }
}

module.exports = exports = new Proxy(new Runner(), {
    get: (obj, method) => {
        if (obj[method]) {
            return obj[method];
        }
        if (task[method]) {
            return task[method];
        }
    }
});

process.title = appTitle + ' task:' + taskName + ' id:' + workerId;
Logger.tasks.info('Task "%s" (worker:%s) is running with tier', taskName, workerId, config.tier);

process.on('unhandledRejection', err => console.log(err.stack));

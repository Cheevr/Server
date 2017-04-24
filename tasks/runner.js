const config = require('cheevr-config').addDefaultConfig(__dirname, '../config');
const later = require('later');
const Logger = require('cheevr-logging');
const moment = require('moment');
const path = require('path');
const CronJob = require('./job.cron');
const IntervalJob = require('./job.interval');
const OnceJob = require('./job.once');


const log = Logger[config.tasks.logger];
const appTitle = process.argv[2];
const workerId = process.argv[3];
const taskFile = process.argv[4];
const taskName = path.basename(taskFile, path.extname(taskFile));
const task = require(taskFile);

/**
 * Will try to send a message up to 3 times to the parent process if it fails.
 * @param {*} message           The message you want to send.
 * @param {number} [retries=0]  The parameter to keep track how often we tried to send to the parent.
 */
function send(message, retries = 0) {
    try {
        process.send(message);
    } catch (err) {
        retries < 3 && setImmediate(() => send(message, ++retries));
    }
}

/**
 * This class acts as the entry points to define jobs. Tasks files will get an instance of this class passed to the
 * default handler where developers can register new jobs and configure task properties.
 */
class Runner {
    constructor() {
        this._enabled = true;
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
     * @param {boolean} enabled
     */
    set enable(enabled) {
        if (!this._enabled && enabled) {
            // TODO go through each job and set a new timeout
            console.log('setting worker/runner to be enabled');
        }
        if (this._enabled && !enabled) {
            // TODO go through each job and clear the timeout
            console.log('setting worker/runner to be disabled');
        }
        this._enabled = enabled;
    }

    /**
     * Allows a developer to register a new job in a task file.
     * @param {JobConfig} jobConfig     The job configuration
     * @param {JobExecutor} executor    The actual job to run
     */
    job(jobConfig, executor) {
        jobConfig.name = jobConfig.name || executor.name;
        if (this._jobs[jobConfig.name]) {
            throw new Error('A job with the given name [' + jobConfig.name + '] has already been configured')
        }
        let job;
        if (jobConfig.once) {
            job = new OnceJob(jobConfig, executor);
        } else if (jobConfig.interval) {
            job = new IntervalJob(jobConfig, executor);
        } else if (jobConfig.cron) {
            job = new CronJob(jobConfig, executor)
        } else {
            throw new Error('The job is missing a valid timing configuration');
        }
        this._jobs[job.id] = job;
        return job;
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
log.info('Task "%s" (worker:%s) is running with tier', taskName, workerId, config.tier);

process.on('unhandledRejection', err => console.log(err.stack));

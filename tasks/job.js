const _ = require('lodash');
const config = require('cheevr-config');
const Context = require('./context');
const Logger = require('cheevr-logging');
const moment = require('moment');
const path = require('path');


/**
 * The general configuration object for any type of job.
 * @typedef {object} JobConfig
 * @property {string} [name=executor.name]  The name for this job, used to identify it later on.
 * @property {number} [sleep=0]             The minimum time to wait between jobs
 */

/**
 * The function that will execute a job is given by the developer.
 * @typedef {function} JobExecutor
 * @params {JobContext} context
 */


const log = Logger[config.tasks.logger];
const taskFile = process.argv[4];
const taskName = path.basename(taskFile, path.extname(taskFile));

class Job {
    /**
     * @param {JobConfig} jobConfig
     * @param {JobExecutor} executor
     */
    constructor(jobConfig, executor) {
        _.defaultsDeep(jobConfig, config.defaults.tasks);
        this._config = jobConfig;
        this._exector = executor;
        this._lastRun = 0;
        this._state = 'idle';

        if (jobConfig.sleep) {
            jobConfig.sleep = Job._toInterval(jobConfig.sleep);
        }
        this._timeout = setTimeout(this.run.bind(this), this.nextRun);
    }

    run() {
        this.state = 'running';
        let context = new Context();
        this._lastRun = moment();
        return context.execute(this).then(() => {
            log.debug('Job "%s" in task "%s" finished within %s', this.id, taskName, context.elapsed.humanize());
            this.state = 'idle';
            return context;
        }).catch(err => {
            log.error('Error running job', err.stack || err.toString());
            this.state = 'error';
        });
    }

    /**
     * Will send the current state to the task object in the parent instance.
     * @param {string} state    Should be one of idle, running or error
     */
    set state(state) {
        this._state = state;
        Job._send({ method:'state', args: [this.id, state]});
    }

    /**
     * Will return the current state (idle, running or error)
     * @returns {string}
     */
    get state() {
        return this._state;
    }

    /**
     * This will a unique identifier for this job (which for now is the user given job name).
     * @returns {string}
     */
    get id() {
        return this._config.name;
    }

    /**
     * @returns {JobExecutor}
     */
    get executor() {
        return this._exector;
    }

    /**
     * @returns {JobConfig}
     */
    get config() {
        return this._config;
    }

    /**
     * @returns {moment.Moment}
     */
    get lastRun() {
        return this._lastRun;
    }

    /**
     * The ms until the next run should occur.
     * @returns {number}
     */
    get nextRun() {
        return this._config.sleep;
    }

    /**
     * Tries a few times to send a message to the parent process.
     * @param {object} message
     * @param {number} [retries=0]
     * @private
     */
    static _send(message, retries = 0) {
        try {
            process.send(message);
        } catch (err) {
            retries < 3 && setImmediate(() => send(message, ++retries));
        }
    }
}

module.exports = exports = Job;

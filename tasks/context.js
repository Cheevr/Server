const config = require('cheevr-config');
const Logger = require('cheevr-logging');
const moment = require('moment');
const path = require('path');


const log = Logger[config.tasks.logger];
const taskFile = process.argv[4];
const taskName = path.basename(taskFile, path.extname(taskFile));

/**
 * The context class is what is being passed into a job executor when it is run and includes various tools to help
 * control the currently running job, such as recording metrics.
 */
class Context {
    constructor() {
        this._metrics = {};
    }

    /**
     * Will execute a job within this context.
     * @param {Job} job
     * @returns {Promise}
     */
    execute(job) {
        this._started = moment();
        return new Promise((resolve, reject) => {
            // TODO add database, metrics & mq to context
            log.debug('Job "%s" in task "%s" has started', job.id, taskName);
            job.executor({resolve, reject});
        }).then(() => {
            this._ended = moment();
            this._elapsed = moment.duration(this._ended.diff(this._started));
        }).catch(err => {
            this._ended = moment.duration(moment().diff(this._started));
            throw err;
        });
    }

    /**
     * When the job running in this context has been started or false if it hasn't been started yet.
     * @returns {moment.Moment|boolean}
     */
    get started() {
        return this._started || false;
    }

    /**
     * When the job running in this context has ended or false if it hasn't been started yet.
     * @returns {moment.Moment|Duration|boolean}
     */
    get ended() {
        return this._ended || false;
    }

    /**
     * How long it took to run the job or false, if it hasn't run yet or is still running.
     * @returns {Duration|boolean}
     */
    get elapsed() {
        return this._elapsed || false;
    }
}

module.exports = exports = Context;

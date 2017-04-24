const Job = require('./job');


/**
 * @typedef {object} OnceJobConfig
 * @extends {JobConfig}
 * @property {boolean} once If set to true will run this job once and only once.
 */


class OnceJob extends Job {
    /**
     * @param {OnceJobConfig} jobConfig
     * @param {JobExecutor} executor
     */
    constructor(jobConfig, executor) {
        super(jobConfig, executor);
    }

    run() {
        super.run().then(() => this._hasRun = true);
    }

    /**
     * Returns the time (ms) until the next job of this id should run.
     * @returns {number}
     * @private
     */
    get nextRun() {
        return this._hasRun ? Number.POSITIVE_INFINITY : super.nextRun;
    }
}

module.exports = OnceJob;

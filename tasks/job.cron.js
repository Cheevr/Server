const config = require('cheevr-config');
const Context = require('./context');
const Job = require('./job');
const later = require('later');
const Logger = require('cheevr-logging');
const path = require('path');


const log = Logger[config.tasks.logger];
const taskFile = process.argv[4];
const taskName = path.basename(taskFile, path.extname(taskFile));

class CronJob extends Job {
    constructor(jobConfig, executor) {
        super(jobConfig, executor);
        jobConfig.cron = later.parse.test(jobConfig.cron);
    }

    run() {
        super.run();
        if (this._state === 'running' && !this.config.allowOverlaps) {
            return log.warn('Skipping job ' + this.id + ' because the previous run is still active');
        }
        // TODO handle cron format
    }

    /**
     * Returns the time (ms) until the next job of this id should run.
     * @returns {number}
     * @private
     */
    get nextRun() {
        // TODO support cron format
    }
}

module.exports = CronJob;

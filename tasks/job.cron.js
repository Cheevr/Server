const Job = require('./job');
const later = require('later');


/**
 * @typedef {object} CronJobConfig
 * @extends {JobConfig}
 * @property {string} cron                      The cron configuration in standard cron format
 * @property {boolean} [includesSeconds=false]  Whether the cron format includes seconds
 */


class CronJob extends Job {
    /**
     * @param {CronJobConfig} jobConfig
     * @param {JobExecutor} executor
     */
    constructor(jobConfig, executor) {
        super(jobConfig, executor);
        jobConfig.cron = later.parse.cron(jobConfig.cron, jobConfig.includesSeconds);
    }

    run() {
        super.run().then(context => {
            later.setTimeout(this.run.bind(this), this._config.cron);
        });
    }
}

module.exports = CronJob;

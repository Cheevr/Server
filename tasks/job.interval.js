const Job = require('./job');
const moment = require('moment');


/**
 * @typedef {object} IntervalJobConfig
 * @extends {JobConfig}
 * @property {boolean} [waitForComplete=true]   For interval jobs whether to wait for finish before calculating next run
 * @property {string|number} interval           Either a number that represents ms or a string that is readable by moment.js
 */


const momentRegexp = /(\d+)(.*)/;

class IntervalJob extends Job {
    /**
     * @param {IntervalJobConfig} jobConfig
     * @param {JobExecutor} executor
     */
    constructor(jobConfig, executor) {
        super(jobConfig, executor);
        jobConfig.interval = IntervalJob._toInterval(jobConfig.interval);
    }

    run() {
        super.run().then(context => {
            if (this._config.waitForComplete) {
                this._lastRun = context.ended;
            }
            setTimeout(this.run.bind(this), this.nextRun);
        });
    }

    /**
     * Returns the time (ms) until the next job of this id should run.
     * @returns {number}
     * @private
     */
    get nextRun() {
        if (!this._lastRun) {
            return this._config.sleep;
        }
        return Math.max(this._lastRun.valueOf() + this._config.interval - Date.now(), super.nextRun);
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
}

module.exports = IntervalJob;

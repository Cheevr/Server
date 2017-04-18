const config = require('cheevr-config');
const Context = require('./context');
const Job = require('./job');
const moment = require('moment');
const Logger = require('cheevr-logging');
const path = require('path');


const log = Logger[config.tasks.logger];
const momentRegexp = /(\d+)(.*)/;
const taskFile = process.argv[4];
const taskName = path.basename(taskFile, path.extname(taskFile));

class IntervalJob extends Job {
    constructor(jobConfig, executor) {
        super(jobConfig, executor);
        jobConfig.interval = IntervalJob._toInterval(jobConfig.interval);
    }


    run() {
        super.run();
        if (this._state === 'running' && !this._config.allowOverlaps) {
            return;
        }
        if (!this._config.waitForComplete) {
            this._lastRun = moment();
        }
        this.state = 'running';
        let context = new Context(taskName);
        context.execute(this).then(() => {
            if (this._config.waitForComplete) {
                this._lastRun = context.ended;
            }
            let timeToNextRun = this.nextRun;
            log.debug('Job "%s" in task "%s" finished within %s, next run in', this.id, taskName, context.elapsed.humanize(), moment.duration(timeToNextRun).humanize());
            this.state = 'idle';
            this.timeout = setTimeout(this.run.bind(this), timeToNextRun);
        }).catch(err => {
            // TODO retry logic && timeouts
            log.error('Error running job', err.stack || err.toString());
            this.state = 'error';
        });
    }

    /**
     * Returns the time (ms) until the next job of this id should run.
     * @returns {number}
     * @private
     */
    get nextRun() {
        return Math.max(this._lastRun.valueOf() - Date.now() + this._config.interval, this._config.sleep);
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

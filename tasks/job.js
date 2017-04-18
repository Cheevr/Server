const _ = require('lodash');
const config = require('cheevr-config');
const moment = require('moment');


class Job {
    constructor(jobConfig, executor) {
        this._config = jobConfig;
        this._exector = executor;
        this._lastRun = 0;
        this._state = 'idle';

        _.defaultsDeep(jobConfig, config.defaults.tasks);
        if (jobConfig.sleep) {
            jobConfig.sleep = Job._toInterval(jobConfig.sleep);
        }
        this.timeout = setTimeout(this.run.bind(this), this.nextRun);
    }

    run() {
        // TODO figure out what can be pulled into the parent method from the different implementations (probably the actual run)
    }

    set state(state) {
        this._state = state;
        Job._send({ method:'state', args: [this.id, state]});
    }

    get state() {
        return this._state;
    }

    get id() {
        return this._config.name;
    }

    get executor() {
        return this._exector;
    }

    get config() {
        return this._config;
    }

    set lastRun(time) {
        this._lastRun = time;
    }

    get lastRun() {
        return this._lastRun;
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

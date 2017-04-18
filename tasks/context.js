const config = require('cheevr-config');
const Logger = require('cheevr-logging');
const moment = require('moment');
const path = require('path');


const log = Logger[config.tasks.logger];
const taskFile = process.argv[4];
const taskName = path.basename(taskFile, path.extname(taskFile));

class Context {
    constructor() {
        this._metrics = {};
    }

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

    get started() {
        return this._started || false;
    }

    get ended() {
        return this._ended || false;
    }

    get elapsed() {
        return this._elapsed || false;
    }
}

module.exports = exports = Context;

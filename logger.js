const _ = require('lodash');
const config = require('config');
const fs = require('fs');
const path = require('path');
const winston = require('winston');


const cwd = path.dirname(require.main.filename);

class Logger {
    constructor() {
        this.logsDir = path.join(cwd, config.paths.logs);
        fs.existsSync(this.logsDir) || fs.mkdirSync(this.logsDir);

        this.transports = {
            console: new winston.transports.Console({
                colorize: true,
                timestamp: true,
                humanReadableUnhandledException: true
            })
        };

        // Set up daily rolling transports for each file
        for (let logger in config.logging.loggers) {
            let logConfig = config.logging.loggers[logger];
            this.transports[logger] = new winston.transports.File({
                filename: path.join(this.logsDir, logConfig.maxSize || logger + '.log'),
                json: false,
                maxFiles: logConfig.maxFiles || 10,
                maxSize: logConfig.maxSize || 10 * 1024 * 1024,
                tailable: true,
                zippedArchive: true
            });
        }

        // Set up loggers that send output to the respective transports
        for (let logger in config.logging.loggers) {
            let logConfig = config.logging.loggers[logger];
            this[logger] = new winston.Logger({
                level: logConfig,
                transports: [this.transports.console, this.transports[logger]],
                levels: config.levels,
                colors: config.colors
            });
        }
    }

    /**
     * @param {ClientRequest} req
     * @param {ServerResponse} res
     * @param {function} next
     */
    middleware(req, res, next) {
        res.on('finish', () => {
            module.exports.requests.info(
                '%s %s id:%s in:%s out:%s time:%s %s (%s)',
                res.statusCode,
                req.method,
                _.padEnd(req.id, 10),
                _.padEnd(req.socket.bytesRead, 5),
                _.padEnd(req.socket.bytesWritten, 5),
                _.padEnd(req.metrics.response.time, 4),
                req.originalUrl,
                req.ip
            );
        });
        next();
    }
}

module.exports = new Logger();

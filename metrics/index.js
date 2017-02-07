const childProces = require('child_process');
const config = require('cheevr-config');
const db = require('cheevr-database');
const moment = require('moment');
const path = require('path');
const shortId = require('shortid');


// Regex safe short ids
shortId.characters('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ@_');
const hostname = require('os').hostname();
const application = path.basename(path.dirname(require.main.filename));

/**
 * A request handler that will record metrics and store them on the request object. The handler will update additional
 * metrics once the response has returned.
 * @param {ClientRequest} req
 * @param {ServerResponse} res
 * @param {function} next
 */
function setRequestMetrics(req, res, next) {
    let startTime = process.hrtime();
    req.id = req.get('id') || shortId.generate();
    req.metrics = {
        '@timestamp': new Date(),
        process: process.pid,
        hostname,
        application,
        tier: config.tier,
        request: {
            method: req.method,
            url: req.originalUrl,
            ip: req.ip
        }
    };
    res.on('finish', () => {
        let endTime = process.hrtime(startTime);
        let time = Math.round(endTime[0] * 1e3 + endTime[1] * 1e-6);
        let status = res.statusCode;
        let size = req.socket.bytesWritten;
        req.args && (req.metrics.request.args = req.args);
        req.metrics.request.size = req.socket.bytesRead;
        req.metrics.response = { status, size, time };
    });
    next();
}

// Only start the dispatcher if kibana is enabled
if (!config.kibana.enabled) {
    module.exports = app => app.use(setRequestMetrics);
    return;
}

// Start a dispatched service that will take care of bulk importing metrics into kibana.
const cwd = process.cwd();
const dispatcher = childProces.fork(
    path.join(__dirname, './dispatcher.js'),
    process.argv.splice(2), {
        cwd,
        env: process.env,
        execArgv: ['--max_old_space_size=' + config.kibana.memory]
    }
);
const shutdownTimer = (process.env.NODE_SHUTDOWN_TIMER || 10) * 500;
const kibana = db.factory('kibana');

process.on('exit', () => {
    dispatcher.kill();
});


function sendDbStats(name, stats) {
    if (!stats || !Object.keys(stats).length) {
        return;
    }
    stats['@timestamp'] = new Date();
    stats.databasename = name;
    stats.process = process.pid;
    stats.hostname = hostname;
    stats.application = application;
    stats.tier = config.tier;
    console.log('sending stats for', name);
    dispatcher.send(stats);
}

let dbs = db.list();
for (let name in dbs) {
    let instance = dbs[name];
    if (instance.config.stats && instance.config.stats.interval) {
        let interval = moment.duration(...instance.config.stats.interval).asMilliseconds();
        setInterval(() => {
            sendDbStats(name, instance.stats);
        }, interval);
    }
}

module.exports = app => {
    app.use(setRequestMetrics);
    app.use((req, res, next) => {
        res.on('finish', () => dispatcher.send(req.metrics));
        next();
    });
    app.on('shutdown', () => setTimeout(() => dispatcher.disconnect(), shutdownTimer));
};

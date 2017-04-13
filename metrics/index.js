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

module.exports = async (app, tasks) => {
    app.use(setRequestMetrics);

    if (config.kibana.enabled) {

        // Request metrics
        let task;
        app.use((req, res, next) => {
            res.on('finish', () => task && task.roundRobin.sendMetrics(req.metrics));
            next();
        });
        task = await tasks.addTask(path.join(__dirname, 'dispatcher'));

        // DB stats polling to metrics
        let dbs = db.list();
        for (let name in dbs) {
            let instance = dbs[name];
            if (instance.config.stats && instance.config.stats.interval) {
                let interval = moment.duration(...instance.config.stats.interval).asMilliseconds();
                setInterval(() => {
                    let stats = instance.stats;
                    if (!stats || !Object.keys(stats).length) {
                        return;
                    }
                    stats['@timestamp'] = new Date();
                    stats.databasename = name;
                    stats.process = process.pid;
                    stats.hostname = hostname;
                    stats.application = application;
                    stats.tier = config.tier;
                    task.roundRobin.send(stats);
                }, interval);
            }
        }
    }
};

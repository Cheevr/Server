const childProces = require('child_process');
const config = require('cheevr-config');
const path = require('path');
const shortId = require('shortid');


// Regex safe short ids
shortId.characters('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ@_');
const hostname = require('os').hostname();
const application = path.basename(path.dirname(require.main.filename));

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
    module.exports.dispatch = () => {};
    return;
}


// Start a dispatched service that will take care of bulk importing metrics into kibana.
const cwd = process.cwd();
const dispatcher = childProces.fork(path.join(__dirname, './dispatcher.js'), [], { cwd, env: process.env });
const shutdownTimer = (process.env.NODE_SHUTDOWN_TIMER || 10) * 500;

process.on('exit', () => {
    dispatcher.kill();
});

module.exports = app => {
    app.use(setRequestMetrics);
    app.use((req, res, next) => {
        res.on('finish', () => dispatcher.send(req.metrics));
        next();
    });
    app.on('shutdown', () => setTimeout(() => dispatcher.disconnect(), shutdownTimer));
};

module.exports.dispatch = metrics => {
    if (!metrics || !Object.keys(metrics).length) {
        return;
    }
    metrics['@timestamp'] = new Date();
    metrics.process = process.pid;
    metrics.hostname = hostname;
    metrics.application = application;
    metrics.tier = config.tier;
    dispatcher.send(metrics);
};

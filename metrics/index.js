var childProces = require('child_process');
var config = require('config');
var path = require('path');


const hostname = require('os').hostname();
const application = path.basename(path.dirname(require.main.filename));
var shutdownTimer = (process.env.NODE_SHUTDOWN_TIMER || 10);

module.exports = app => {
    if (!config.kibana.enabled) {
        return;
    }
    const dispatcher = childProces.fork(path.join(__dirname, './dispatcher.js'), process.argv);
    app.use((req, res, next) => {
        let incoming = 0;
        let startTime = process.hrtime();
        let sizeOffset = req.socket._bytesDispatched;
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
        req.on('data', chunk => incoming += chunk.length);
        res.on('finish', function () {
            let endTime = process.hrtime(startTime);
            let time = Math.round(endTime[0] * 1e3 + endTime[1] * 1e-6);
            let status = res.statusCode;
            let size = req.socket._bytesDispatched - sizeOffset;
            req.metrics.request.size = incoming;
            req.metrics.response = { status, size, time };
            dispatcher.send(req.metrics);
        });
        next();
    });
    app.on('shutdown', () => {
        setTimeout(() => {
            dispatcher.disconnect();
        }, shutdownTimer * 500);
    });
    process.on('exit', () => {
        dispatcher.kill();
    });
};
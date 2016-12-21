const childProces = require('child_process');
const config = require('config');
const path = require('path');


if (!config.kibana.enabled) {
    module.exports = () => {};
    return;
}

const dispatcher = childProces.fork(path.join(__dirname, './dispatcher.js'), process.argv);
const hostname = require('os').hostname();
const application = path.basename(path.dirname(require.main.filename));
let shutdownTimer = (process.env.NODE_SHUTDOWN_TIMER || 10);

process.on('exit', () => {
    dispatcher.kill();
});

module.exports = app => {
    app.use((req, res, next) => {
        let startTime = process.hrtime();
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
        res.on('finish', function () {
            let endTime = process.hrtime(startTime);
            let time = Math.round(endTime[0] * 1e3 + endTime[1] * 1e-6);
            let status = res.statusCode;
            let size = req.socket.bytesWritten;
            req.args && (req.metrics.request.args = req.args);
            req.metrics.request.size = req.socket.bytesRead;
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

module.exports.feedback = app => {
    app.post('/feedback', app.noauth, (req, res) => {
        let feedback = req.body;
        if (!feedback.message || !feedback.message.length) {
            return res.status(422).end();
        }
        req.user && (feedback.userid = req.user.id);
        // TODO add geoip
        feedback.ip = req.ip;
        feedback['@timestamp'] = new Date();
        feedback.tier = config.tier;
        feedback.process = process.pid;
        feedback.hostname = hostname;
        feedback.application = application;
        req.es.index({
            index: 'feedback',
            type: 'entry',
            body: feedback
        }, err => {
            if (err) {
                throw err;
            }
            res.end();
        });
    });
};

const path = require('path');
const config = require('cheevr-config');
config.addDefaultConfig(path.join(__dirname, '../config'));


const async = require('async');
const Database = require('cheevr-database');
const geoip = require('geoip-lite');
const Logger = require('cheevr-logging');

process.title = config.kibana.process + ' tier:' + config.tier;
const index = config.kibana.index;
const defaultType = config.kibana.type;
const bulkSize = 100;
const interval = 1000;
const buffer = [];
const db = Database.factory('kibana');

exports.setGeoIP = metric => {
    if (!metric.request || !metric.request.ip) {
        return;
    }
    let ip = metric.request.ip;
    ip = ip.startsWith('::ffff:') ? ip.substr(7) : ip;
    let geo = geoip.lookup(ip);
    if (geo && geo.ll) {
        metric.geoip = {
            latitude: geo.ll[0],
            longitude: geo.ll[1],
            location: geo.ll[0] + ',' + geo.ll[1]
        };
    }
};

exports.poll = kill => {
    while (buffer.length) {
        let metrics = buffer.splice(0, bulkSize);
        let bulkRequest = [];
        async.each(metrics, (metric, cb) => {
            async.retry(3, cb => {
                exports.setGeoIP(metric);
                bulkRequest.push({index: {_index: index, _type: defaultType}});
                bulkRequest.push(metric);
                cb();
            }, cb);
        }, err => {
            err && console.log('Unable to create index on Kibana', err);
            db.bulk({
                body: bulkRequest
            }, err => err && console.log('Unable to send metrics to Kibana', err));
        });
    }
    if (kill) {
        clearInterval(timeout);
        process.exit();
    }
};

process.on('message', message => buffer.push(message));
process.on('SIGTERM', exports.poll.bind(null, true));

// Watch parent exit when it dies
process.stdout.resume();
process.stdout.on('end', () => process.exit());

let timeout = setInterval(exports.poll, interval);
Logger.server.info('Dispatcher is running with tier', config.tier);

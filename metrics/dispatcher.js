const async = require('async');
const config = require('config');
const Database = require('../database/index');
const geoip = require('geoip-lite');
const path = require('path');


process.title = 'cheevr-metrics' + ' tier:' + config.tier;
config.addDefaultConfig(path.join(__dirname, '../config'));
const index = 'logstash';
const type = 'metric';
const bulkSize = 100;
const interval = 1000;
const buffer = [];
const db = new Database(config.kibana, false);

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
                bulkRequest.push({index: {_index: index, _type: type}});
                bulkRequest.push(metric);
                cb();
            }, cb);
        }, err => {
            err && console.log('Unable to create index on Kibana', err);
            db.client.bulk({
                body: bulkRequest
            }, err => err && console.log('Unable to send metrics to Kibana', err));
        });
    }
    if (kill) {
        clearInterval(timeout);
        console.log('Metrics dispatcher terminated');
        process.exit();
    }
};

process.on('message', message => buffer.push(message));
process.on('SIGTERM', exports.poll.bind(null, true));

// Watch parent exit when it dies
process.stdout.resume();
process.stdout.on('end', () => process.exit());

let timeout = setInterval(exports.poll, interval);
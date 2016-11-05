var async = require('async');
var config = require('config');
var Database = require('../database');
var geoip = require('geoip-lite');
var path = require('path');


process.title = 'cheevr-metrics' + ' tier:' + config.tier;
config.addDefaultConfig(path.join(__dirname, '../config'));
const type = 'metric';
const bulkSize = 100;
const interval = 1000;
const buffer = [];
var lastIndex = null;
const client = new Database(config.kibana, false).client;

exports.getIndex = (date, cb) => {
    date = new Date(date);
    let day = date.getDate();
    day = day > 9 ? day : '0' + day;
    let month = date.getMonth() + 1;
    month = month.length == 2 ? month : '0' + month;
    let year = date.getFullYear();
    let index = `logstash-${year}.${month}.${day}`;
    if (index != lastIndex) {
        lastIndex = index;
        exports.createMapping(lastIndex, cb);
    }
};

exports.setGeoIP = metric => {
    if (!metric.request.ip) {
        return;
    }
    var ip = metric.request.ip;
    ip = ip.startsWith('::ffff:') ? ip.substr(7) : ip;
    var geo = geoip.lookup(ip);
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
        console.log('Dispatching', metrics.length, 'messages');
        let bulkRequest = [];
        async.each(metrics, (metric, cb) => {
            async.retry(3, cb => {
                exports.getIndex(metric['@timestamp'], (err, index) => {
                    exports.setGeoIP(metric);
                    bulkRequest.push({index: {_index: index, _type: type}});
                    bulkRequest.push(metric);
                    cb(err);
                });
            }, cb);
        }, err => {
            err && console.log('Unable to create index on Kibana', err);
            client.bulk({
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

exports.createMapping = (index, cb) => {
    async.waterfall([
        cb => client.indices.exists({index}, cb),
        (exists, ignored, cb) => {
            if (exists) {
                return cb();
            }
            console.log('Creating index', index);
            client.indices.create({ index, body: { mappings: { [index]: config.kibana.mapping } } }, cb)
        },
    ], err => cb(err, index));
};

process.on('message', message => buffer.push(message));
process.on('SIGTERM', exports.poll.bind(null, true));

let timeout = setInterval(exports.poll, interval);
const config = require('@cheevr/config').addDefaultConfig(__dirname, '../config');
const async = require('async');
const Database = require('@cheevr/database');
const geoip = require('geoip-lite');
const Logger = require('@cheevr/logging');


const index = config.kibana.index;
const defaultType = config.kibana.type;
const bulkSize = 100;
const buffer = [];
const db = Database.factory('kibana');

module.exports = exports = Runner => {
    Runner.job({
        name: 'Metrics Exporter',
        interval: '10s',
    }, context => {
        // TODO get database from context
        exports.poll(context.resolve);
    });
};

/**
 * Receiver method from parent tasks
 * @param metrics
 */
exports.sendMetrics = metrics => {
    buffer.push(metrics);
};

// TODO look for ip fields anywhere in the object
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

/**
 * Fetches any buffered metrics and sends them to Kibana in a bulk request.
 */
exports.poll = cb => {
    // TODO bulk requests will not wait for previous ones to complete
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
            err && Logger.server.error('Unable to create index on Kibana', err);
            db.bulk({
                body: bulkRequest
            }, err => err && Logger.server.error('Unable to send metrics to Kibana', err));
        });
    }
    cb && cb();
};

process.on('SIGTERM', () => exports.poll());

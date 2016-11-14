var config = require('config');
var Stats = require('./stats');


class Cache {
    constructor(database) {
        this._db = database;
        this._stats = new Stats();
        this._cache = new (require('./' + config.cache.type))(this._stats);
        // TODO Add cron to metrics module that will fetch cache statistics in a regular interval
    }

    /**
     * Returns a proxy around the database that will first query the cache service to see if it can return the data
     * without going to database.
     * @returns {*}
     */
    get proxy() {
        const that = this;
        return new Proxy(this._db.client, {
            get(target, propKey) {
                const origMethod = target[propKey];
                return (params, cb) => {
                    let cache = params.cache;
                    delete params.cache;
                    that._stats.request = cache ? cache : params.index + ':' + params.type + ':' + params.key;
                    that._fetch(cache, (err, result) => {
                        if (err || result) {
                            return cb(err, result);
                        }
                        origMethod.call(target, params, (err, results) => {
                            if (err) {
                                return cb(err, results);
                            }
                            that._store(cache, results, cb);
                        });
                    });
                };
            }
        });
    }

    _fetch(cache, cb) {
        if (!cache) {
            return cb();
        }
        this._cache.fetch(cache, cb);
    }

    _store(cache, data, cb) {
        if (!cache) {
            return cb(null, data);
        }
        this._cache.store(cache, data, cb);
    }
}

module.exports = Cache;
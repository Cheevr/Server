var config = require('config');
var moment = require('moment');


class Memory {
    constructor(stats) {
        let ttl = Array.isArray(config.cache.ttl) ? config.cache.ttl : [ config.cache.ttl ];
        this._ttl = moment.duration(...ttl).asMilliseconds();
        this._map = {};
        this._timeouts = {};
        this._stats = stats;
    }

    /**
     * Returns the key if it exists in this cache.
     * @param {string} key
     * @param {function} cb
     */
    fetch(key, cb) {
        this._map[key] ? this._stats.hit = key : this._stats.miss = key;
        cb(null, this._map[key]);
    }

    /**
     * Stores data in this cache.
     * @param {string} key
     * @param {object} data
     * @param {function} cb
     */
    store(key, data, cb) {
        this._map[key] = data;
        this._timeouts[key] && clearTimeout(this._timeouts[key]);
        this._timeouts[key] = setTimeout(key => delete this._map[key], this._ttl);
        cb(null, data);
    }

    /**
     * Returns a statistics objects that informs about hit, miss and refresh numbers.
     * Calling a the stats will reset them
     * @returns CacheStats
     */
    get stats() {
        return this._stats.snapshot;
    }
}

module.exports = Memory;
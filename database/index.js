var async = require('async');
var config = require('config');
var elasticsearch = require('elasticsearch');
var fs = require('fs');
var path = require('path');
var Stats = require('./stats');


const cwd = path.dirname(require.main.filename);

class Database {
    /**
     *
     * @param {object} opts The ElasticSearch options object
     * @param {string} dir  The file or directory with the mappings for all the indices
     */
    constructor(opts = config.elasticsearch, dir = config.paths.schemas) {
        if (dir) {
            this._dir = path.isAbsolute(dir) ? dir : path.join(cwd, dir);
        }
        this._opts = opts;
        this._ready = false;
        this._client = new elasticsearch.Client(this._opts.client);
        this._stats = new Stats();
        this._cache = new (require('./' + config.cache.type))(this._stats);
        // allow connection to be established
        setTimeout(this._createMappings.bind(this), 100);
    }

    middleware() {
        return (req, res, next) => {
            req.es = this.client;
            req.es.ready = this.ready;
            next();
        }
    }

    /**
     * Returns an ElasticSearch client that is wrapped by a caching object.
     * @returns {Proxy.<elasticsearch.Client>}
     */
    get client() {
        const that = this;
        return new Proxy(this._client, {
            get(target, propKey) {
                let original = target[propKey];
                if (target[propKey]) {
                    return (params, cb) => {
                        let cache = params.cache;
                        delete params.cache;
                        that._stats.request = cache ? cache : params.index + ':' + params.type + ':' + params.key;
                        that._fetch(cache, (err, result) => {
                            if (err || result) {
                                return cb(err, result);
                            }
                            original.call(target, params, (err, results) => {
                                if (err) {
                                    return cb(err, results);
                                }
                                that._store(cache, results, cb);
                            });
                        });
                    };
                }
            }
        });
    }

    get ready() {
        return this._ready;
    }

    get stats() {
        return this._stats.snapshot;
    }

    _createMappings() {
        this._client.cluster.health({
            waitForStatus: 'yellow',
            waitForEvents: 'normal'
        }, err => {
            if (err) {
                return console.log('Unable to connect to ElasticSearch cluster', err);
            }
            if (!fs.existsSync(this._dir)) {
                return this._ready = true;
            }
            let files;
            let tasks = [];
            if (fs.statSync(this._dir).isDirectory()) {
                files = fs.readdirSync(this._dir);
                for (let file of files) {
                    let ext = path.extname(file);
                    let index = this._opts.index || path.basename(file, ext);
                    let schema = require(path.join(this._dir, file));
                    tasks.push(cb => {
                        this._client.indices.exists({index}, (err, exists) => {
                            if (exists) {
                                return cb();
                            }
                            this._client.indices.create({index, body: schema}, cb);
                        });
                    });
                }
            } else {
                let ext = path.extname(this._dir);
                let index = this._opts.index || path.basename(this._dir, ext);
                let schema = require(this._dir);
                tasks.push(cb => {
                    this.client.indices.exists({index}, exists => {
                        if (exists) {
                            return cb();
                        }
                        this.client.indices.create({index, body: schema}, cb);
                    });
                });
            }
            async.parallel(tasks, err => {
                if (err) {
                    return console.log('There was an error setting the mapping for ElasticSearch', err);
                }
                this._ready = true;
            });
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

module.exports = Database;
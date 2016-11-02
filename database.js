var async = require('async');
var config = require('config');
var elasticsearch = require('elasticsearch');
var fs = require('fs');
var path = require('path');


const cwd = path.dirname(require.main.filename);

class Database {
    constructor(opts = config.elasticsearch, dir = config.paths.schemas) {
        this._dir = path.isAbsolute(dir) ? dir : path.join(cwd, dir);
        this._opts = opts;
        this._ready = false;
        this._client = new elasticsearch.Client(this._opts.client);
        setTimeout(this._createMappings, 100);
    }

    get client() {
        return this._client;
    }

    _createMappings() {
        if (!fs.existsSync(this._dir)) {
            return this._ready = true;
        }
        this._client.cluster.health({
            waitForStatus: 'green',
            waitForEvents: 'normal'
        }, err => {
            if (err) {
                return console.log('Unable to connect to ElasticSearch cluster', err);
            }
            let files = fs.readdirSync(this._dir);
            let tasks = [];
            for (let file of files) {
                let ext = path.extname(file);
                let index = this._opts.index || path.basename(file, ext);
                let schema = require(path.join(this._dir, file));
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

    middleware() {
        return (req, res, next) => {
            req.es = this.client;
            req.es.ready = this.ready;
            next();
        }
    }

    get ready() {
        return this._ready;
    }
}

module.exports = Database;
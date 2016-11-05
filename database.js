var async = require('async');
var config = require('config');
var elasticsearch = require('elasticsearch');
var fs = require('fs');
var path = require('path');


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
        setTimeout(this._createMappings.bind(this), 100);
    }

    get client() {
        return this._client;
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
                        this.client.indices.exists({index}, (err, exists) => {
                            if (exists) {
                                return cb();
                            }
                            this.client.indices.create({index, body: schema}, cb);
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
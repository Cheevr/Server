const _ = require('lodash');
const config = require('cheevr-config');
const fs = require('fs');
const Logger = require('cheevr-logging');
const path = require('path');
const util = require('util');


const cwd = process.cwd();
const viewDir = config.normalizePath(cwd, config.paths.views);
viewDir.push(path.join(__dirname, 'static/views'));

if (config.printConfig) {
    function clean(obj) {
        for (let prop in obj) {
            let val = obj[prop];
            if (_.isObject(val) && !(val instanceof Buffer)){
                clean(val);
            } else if (_.isArray(val)) {
                for (let entry of val) {
                    clean(entry);
                }
            } else {
                switch (prop) {
                    case 'password':
                    case 'salt':
                    case 'secret':
                    case 'key':
                        obj[prop] = '*****'
                }
            }
        }
    }
    let copy = _.cloneDeep(config);
    delete copy._default;
    clean(copy);
    Logger.server.info('Launch Configuration: ' + util.inspect(copy, {showHidden: false, depth: null}));
}

module.exports = app => {
    // Configure the jsonp callback
    app.set('jsonp callback name', 'cb');

    // Set proper ip address reporting
    app.set('trust proxy', true);

    // Set view engine to pug
    let views = viewDir.filter(dir => fs.existsSync(dir));
    app.set('view engine', 'pug');
    app.set('views', views);

    // Set the process name to something friendly
    process.title = 'cheevr-' + path.basename(cwd) + ' tier:' + config.tier + ' port:' + config.backend.port;
};

var config = require('config');
var fs = require('fs');
var path = require('path');


const cwd = path.dirname(require.main.filename);
const viewDir = config.normalizePath(cwd, config.paths.views);
const errorDir = config.normalizePath(cwd, config.paths.errors);

module.exports = app => {
    // Configure the jsonp callback
    app.set('jsonp callback name', 'cb');

    // Set proper ip address reporting
    app.set('trust proxy', true);

    // Set view engine to pug
    let views = viewDir.concat(errorDir).filter(dir => fs.existsSync(dir));
    app.set('view engine', 'pug');
    app.set('views', views);

    // Set the process name to something friendly
    process.title = 'cheevr-' + path.basename(cwd) + ' tier:' + config.tier + ' port:' + config.backend.port;
};
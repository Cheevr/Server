var config = require('config');
var fs = require('fs');
var path = require('path');


const cwd = path.dirname(require.main.filename);

module.exports = app => {
    // Configure the jsonp callback
    app.set('jsonp callback name', 'cb');

    // Set proper ip address reporting
    app.set('trust proxy', true);

    // Set view engine to pug
    let viewDir = path.isAbsolute(config.paths.views) ? config.paths.views : path.join(cwd, config.paths.views);
    let errorDir = path.isAbsolute(config.paths.errors) ? config.paths.errors : path.join(cwd, config.paths.errors);
    if (fs.existsSync(viewDir)) {
        app.set('view engine', 'pug');
        app.set('views', [ viewDir, errorDir ]);
    }

    // Set the process name to something friendly
    process.title = 'cheevr-' + path.basename(cwd) + ' tier:' + config.tier + ' port:' + config.backend.port;
};
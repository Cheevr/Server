var config = require('config');
var path = require('path');


const cwd = path.dirname(require.main.filename);

module.exports = app => {
    // Configure the jsonp callback
    app.set('jsonp callback name', 'cb');

    // Set proper ip address reporting
    app.set('trust proxy', true);

    // Set view engine to pug
    app.set('view engine', 'pug');
    app.set('views', path.join(cwd, config.backend.paths.views));

    // Set the process name to something friendly
    process.title = 'cheevr-' + path.basename(cwd) + ' tier:' + config.tier + ' port:' + config.backend.port;
};
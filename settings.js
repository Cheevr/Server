const config = require('cheevr-config');
const fs = require('fs');
const path = require('path');


const cwd = process.cwd();
const viewDir = config.normalizePath(cwd, config.paths.views);
viewDir.push(path.join(__dirname, 'static/views'));

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

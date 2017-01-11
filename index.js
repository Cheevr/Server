const path = require('path');
const config = require('config');
// Set default server config
config.addDefaultConfig(path.join(__dirname, 'config'));
// Set default server translations
const lang = require('lang');
lang.addDirectory(path.join(__dirname, 'lang'));

const express = require('express');
const Logger = require('./logger');
const metrics = require('./metrics');
const moment = require('moment');
const Database = require('./database');

const app = express();
const db = new Database();
app.use(db.middleware());
config.kibana.enabled && setInterval(
    () => metrics.dispatch({cache: db.stats}),
    moment.duration(...config.cache.stats.interval).asMilliseconds()
);

require('./settings')(app);
metrics(app);
app.use(Logger.middleware);
require('./security')(app);
require('./status')(app);
require('./headers')(app);
require('./auth')(app);
require('./content')(app);

// Server Startup
app.listen(config.backend.port);
console.log('listening on port', config.backend.port, 'with tier', config.tier);


const config = require('config');
const express = require('express');
const lang = require('lang');
const metrics = require('./metrics');
const moment = require('moment');
const Database = require('./database');
const path = require('path');


config.addDefaultConfig(path.join(__dirname, 'config'));
lang.addDirectory(path.join(__dirname, 'lang'));
const app = express();
const db = new Database();
app.use(db.middleware());
setInterval(() => metrics.dispatch({cache: db.stats}), moment.duration(...config.cache.stats.interval).asMilliseconds());

require('./settings')(app);
metrics(app);
require('./security')(app);
require('./status')(app);
require('./headers')(app);
require('./auth')(app);
require('./content')(app);

// Server Startup
app.listen(config.backend.port);
console.log('listening on port', config.backend.port, 'with tier', config.tier);


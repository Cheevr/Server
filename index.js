var config = require('config');
var express = require('express');
var lang = require('lang');
var metrics = require('./metrics');
var moment = require('moment');
var Database = require('./database');
var path = require('path');


config.addDefaultConfig(path.join(__dirname, 'config'));
lang.addDirectory(path.join(__dirname, 'lang'));
const app = express();
const db = new Database();
app.use(db.middleware());

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


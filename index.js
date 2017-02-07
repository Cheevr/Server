const path = require('path');
const config = require('cheevr-config');
// Set default server config
config.addDefaultConfig(path.join(__dirname, 'config'));
// Set default server translations
const lang = require('cheevr-lang');
lang.addDirectory(path.join(__dirname, 'lang'));

const express = require('express');
const Logger = require('cheevr-logging');
const db = require('cheevr-database');

const app = express();
require('./settings')(app);
require('./metrics')(app);
app.use(Logger.middleware);
require('./security')(app);
app.use(db.middleware());
require('./status')(app);
require('./headers')(app);
require('./auth')(app);
require('./users')(app);
require('./content')(app);

// Server Startup
app.listen(config.backend.port);
Logger.server.info('listening on port %s with tier %s', config.backend.port, config.tier);


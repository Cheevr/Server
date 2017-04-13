const config = require('cheevr-config').addDefaultConfig(__dirname, 'config');
const express = require('express');
const lang = require('cheevr-lang').extend(__dirname, 'lang');
const Logger = require('cheevr-logging');
const db = require('cheevr-database');
const path = require('path');
const Tasks = require('./tasks');


const app = express();

require('./settings')(app);
require('./metrics')(app, Tasks);
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


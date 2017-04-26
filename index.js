const config = require('cheevr-config').addDefaultConfig(__dirname, 'config');
const db = require('cheevr-database');
const express = require('express');
const lang = require('cheevr-lang').extend(__dirname, 'lang');
const Logger = require('cheevr-logging');
const path = require('path');


const app = express();

require('./settings')(app);
require('./metrics')(app);
app.use(Logger.middleware);
require('./security')(app);
app.use(db.middleware());
require('./status')(app);
require('cheevr-tasks').endpoint(app);
require('./headers')(app);
require('./auth')(app);
require('./users')(app);
require('./content')(app);

// Server Startup
app.listen(config.backend.port);
Logger.server.info('listening on port %s with tier %s', config.backend.port, config.tier);


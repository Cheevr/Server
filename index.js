const config = require('@cheevr/config').addDefaultConfig(__dirname, 'config');
const Database = require('@cheevr/database');
const Metrics = require('@cheevr/metrics');
const express = require('express');
const lang = require('@cheevr/lang').extend(__dirname, 'lang');
const Logger = require('@cheevr/logging');
const path = require('path');


const app = express();

require('./settings')(app);
app.use(Metrics.middleware);
app.use(Logger.middleware);
require('./security')(app);
app.use(Database.middleware());
require('./status')(app);
require('@cheevr/tasks').endpoint(app);
require('./headers')(app);
require('./auth')(app);
require('./users')(app);
require('./content')(app);

// Server Startup
app.listen(config.backend.port);
Logger.server.info('listening on port %s with tier %s', config.backend.port, config.tier);


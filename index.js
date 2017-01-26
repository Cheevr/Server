const path = require('path');
const config = require('cheevr-config');
// Set default server config
config.addDefaultConfig(path.join(__dirname, 'config'));
// Set default server translations
const lang = require('cheevr-lang');
lang.addDirectory(path.join(__dirname, 'lang'));

const express = require('express');
const Logger = require('cheevr-logging');
const moment = require('moment');
const db = require('cheevr-database');

const app = express();
app.use(db.middleware());
// TODO stats reporting needs to be done in metrics module for each database connection
// if (config.kibana.enabled) {
//     let kibana = db.factory('kibana');
//     setInterval(
//         () => metrics.dispatch({cache: kibana.stats}),
//         moment.duration(...config.database.kibana.stats.interval).asMilliseconds()
//     );
// }

require('./settings')(app);
require('./metrics')(app);
app.use(Logger.middleware);
require('./security')(app);
require('./status')(app);
require('./headers')(app);
require('./auth')(app);
require('./users')(app);
require('./content')(app);

// Server Startup
app.listen(config.backend.port);
Logger.server.info('listening on port %s with tier %s', config.backend.port, config.tier);


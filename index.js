var config = require('config');
var express = require('express');
var lang = require('lang');
var path = require('path');


config.addDefaultConfig(path.join(__dirname, 'config'));
lang.addDirectory(path.join(__dirname, 'lang'));
const app = express();

require('./settings')(app);
require('./security')(app);
require('./status')(app);
require('./headers')(app);
require('./content')(app);

// Server Startup
app.listen(config.backend.port);
console.log('listening on port', config.backend.port, 'with tier', config.tier);


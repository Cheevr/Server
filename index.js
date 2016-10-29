var config = require('config');
var express = require('express');
var lang = require('lang');
var path = require('path');

lang.addDirectory(path.join(__dirname, 'lang'));
const app = express();

require('./settings')(app);
require('./security')(app);
require('./status')(app);
require('./headers')(app);
require('./content')(app);

// Server Startup
app.listen(config.port);
console.log('listening on port', config.port, 'with tier', config.tier);


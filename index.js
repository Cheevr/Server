var config = require('config');
var express = require('express');


const app = module.exports = express();

require('./settings')(app);
require('./security')(app);
require('./status')(app);
require('./headers')(app);
require('./content')(app);

// Server Startup
app.listen(config.port);
console.log('listening on port', config.port, 'with tier', config.tier);


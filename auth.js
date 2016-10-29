var config = require('config');
var tokens = require('express-token-api-middleware');


// Make the default authentication type token
module.exports = app => {
    app.auth = tokens(config.auth);
};
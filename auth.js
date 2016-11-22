const config = require('config');
const tokens = require('express-token-api-middleware');


// Make the default authentication type token
module.exports = app => {
    app.auth = tokens(config.auth);
};
const _ = require('lodash');
const config = require('config');
const tokens = require('express-token-api-middleware');


// Make the default authentication type token
module.exports = app => {
    app.auth = tokens(config.auth);

    let noAuthConfig = _.cloneDeep(config.auth);
    noAuthConfig.error = (req, res, next) => next();
    app.noauth = tokens(noAuthConfig);
};
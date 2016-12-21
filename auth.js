const _ = require('lodash');
const config = require('config');
const tokens = require('express-token-api-middleware');


/**
 * Will add a configured authentication module that will add a user property to a request if the user authenticated.
 * Any endpoint that wants to make use of will have to use app.auth with an automatic rejection handler or app.noauth
 * with a handler that will parse users if it can, but still continue execution of the handler chain even if auth fails.
 *
 * Note that this will not include any endpoints to sign in/out but only the required methods to authenticate a request.
 * @param app
 */
module.exports = app => {
    if (config.auth) {
        let noAuthConfig = _.cloneDeep(config);
        noAuthConfig.error = (req, res, next) => next();

        app.auth = tokens(config.auth);
        app.noauth = tokens(noAuthConfig);
    } else {
        app.auth = app.noauth = (req, res, next) => next();
    }
};

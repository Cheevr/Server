var compression = require('compression');
var config = require('config');
var cookieParser = require('cookie-parser');
var errorHandler = require('errorhandler');
var lang = require('lang');
var responseTime = require('response-time');


module.exports = app => {
    // Set cache expiration in prod for static resources
    if (config.isProd) {
        app.use('/css|/js|/img', (req, res, next) => {
            res.setHeader('Cache-Control', 'public, max-age=' + config.backend.cacheTime);
            next();
        });
    }
    // Set debugging information for development env
    else {
        app.use(errorHandler());
        app.use(responseTime());
    }

    // Support for browsers with gzip compression
    app.use(compression());

    // Support cookies in requests
    app.use(cookieParser());

    // TODO better error page when wrong format locale
    // Detect browser language
    app.use(lang.middleware());
};
const compression = require('compression');
const config = require('config');
const cookieParser = require('cookie-parser');
const lang = require('lang');
const responseTime = require('response-time');


module.exports = app => {
    // Set debugging information for development env
    config.isProd || app.use(responseTime());

    // Support cookies in requests
    app.use(cookieParser());

    // Detect browser language
    app.use(lang.middleware());
    lang.errorHandler = (req, res) => {
        res.status(422).render('422', { dict: lang.dictionary.backend });
    };

    // Support for browsers with gzip compression
    app.use(compression());
};
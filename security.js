var bodyParser = require('body-parser');
var config = require('config');
var helmet = require('helmet');


const maxBodySize = config.backend && config.backend.maxBodySize || 10000000;
const allowedHosts = config.backend && config.backend.allowedHosts || ['localhost:' + config.port];

function checkOrigin(origin) {
    for (let host of allowedHosts) {
        if (origin.match(host)) {
            return true;
        }
    }
    return false;
}

module.exports = app => {
    // Protection against various attacks
    app.use(helmet());

    // Set up cross domain security
    app.use((req, res, next) => {
        var origin = req.headers.origin || req.headers.referer;
        if (origin) {
            if (!checkOrigin(origin)) {
                return res.status(405).end('Unknown origin');
            }
            res.header('Access-Control-Allow-Origin', origin);
            res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, OPTIONS');
            res.header('Access-Control-Allow-Credentials', true);
            res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With, ' +
                'Access-Control-Allow-Origin, X-HTTP-Method-Override, X-HTTP-Method, X-Method-Override, Accept, Cookie, ' +
                'Cache-Control, If-Modified-Since, If-None-Match, X-ResponseTime-Average, Range');
            res.header('Access-Control-Max-Age', '86400');
            res.header('Accept-Ranges', 'bytes');
        }
        if ('OPTIONS' == req.method) {
            res.sendStatus(200);
        } else {
            next();
        }
    });

    // Parse json bodies
    app.post(/.*/, bodyParser.json({
        limit: maxBodySize,
        type: 'application/json'
    }));

    // Parse form bodies
    app.post(/.*/, bodyParser.urlencoded({
        limit: maxBodySize,
        extended: false,
        type: 'application/x-www-form-urlencoded'
    }));
};
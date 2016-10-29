exports.port = 8080;

// Paths required for the modularized server instance.
exports.paths = {
    views: 'static/views',
    img: 'static/img',
    js: 'static/js',
    styles: 'static/styles',
    cache: 'cache',
    lang: 'lang'
};

exports.locale = {
    default: 'en-US',
    paramName: 'lang'
};

// Maximum size in bytes
exports.maxBodySize = 10000000;

// Allowed domains for cross domain requests
exports.allowedHosts = ['localhost:' + exports.port];

// Cache time in seconds for css, js and images
exports.cacheTime = 3600;
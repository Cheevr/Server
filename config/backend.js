module.exports = {
    port: 8000,
    maxBodySize: '10mb',
    // Cache time in seconds for css, js and images
    cacheTime: 86400000,
    printConfig: true
};

// Allowed domains for cross domain requests
exports.allowedHosts = ['localhost:' + exports.port];

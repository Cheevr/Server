var path = require('path');

module.exports = {
    views: 'static/views',
    img: 'static/img',
    js: 'static/js',
    styles: 'static/styles',
    cache: 'cache',
    routes: 'routes',
    errors: path.join(__dirname, '../errors')
};
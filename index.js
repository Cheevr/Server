var config = require('config');
var express = require('express');
var fs = require('fs');
var path = require('path');
var stylus = require('stylus');

var app = module.exports = express();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, '../' + config.paths.views));

// Stylus to CSS compiler on request
app.use('/css', stylus.middleware({
    src: config.paths.styles,
    dest: config.paths.cache,
    compress: config.tier == 'production',
    sourcemap: process.env.ENV != 'production'
}));

// Static files server
app.use('/css|/js', express.static(path.join(__dirname, '../' + config.paths.cache)));
app.use('/img', express.static(path.join(__dirname, '../' + config.paths.img)));
app.use('/js', express.static(path.join(__dirname, '../'+ config.paths.js)));
app.get('/', (req, res) => res.render('index'));

// Load all routes
let routeDir = path.join(__dirname, '..', config.paths.routes);
let files = fs.readdirSync(routeDir);
for (let file of files) {
    let route = require(path.join(routeDir, file));
    app.use(route.endpoint, route);
}

// Debug handler
app.use((req, res) => {
    res.status(404).end();
});

// Server Startup
app.listen(config.port);
console.log('listening on port', config.port, 'with tier', config.tier);


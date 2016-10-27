var config = require('config');
var express = require('express');
var fs = require('fs');
var path = require('path');
var stylus = require('stylus');

var app = module.exports = express();
var shutdown = false;
var shutdownTimer = process.env.NODE_SHUTDOWN_TIMER || 10;

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, '../' + config.paths.views));

// Health check that will gracefully signal shutdown
app.get('/health', (req, res) => {
    if (shutdown) {
        return res.status(500).end();
    }
    res.end();
});

// Shutdown handler for graceful termination with delay for drain
process.on('SIGTERM', () => {
    console.log('SIGTERM: Shutting down in', shutdownTimer, 'seconds!');
    shutdown = true;
    setInterval(() => console.log(--shutdownTimer), 1001);
    setTimeout(process.exit, shutdownTimer * 999, 0);
});

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

// Default handler
app.use((req, res) => {
    // TODO use i18n system (convert gulp-international to express middleware plugin)
    res.status(404).end('File not found!');
});

// Server Startup
app.listen(config.port);
console.log('listening on port', config.port, 'with tier', config.tier);


var config = require('config');
var express = require('express');
var fs = require('fs');
var helmet = require('helmet');
var lang = require('lang');
var path = require('path');
var stylus = require('stylus');


const cwd = path.dirname(require.main.filename);
const app = module.exports = express();
const cacheTime = 3600;
var shutdown = false;
var shutdownTimer = process.env.NODE_SHUTDOWN_TIMER || 10;

app.set('view engine', 'pug');
app.set('views', path.join(cwd, config.paths.views));

// Protection against various attacks
app.use(helmet());

// TODO better error page when wrong format locale
// Detect browser language
app.use(lang.middleware());

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

// Set cache expiration in prod for static resources
if (config.isProd) {
    app.use('/css|/js|/img', (req, res, next) => {
        res.setHeader('Cache-Control', 'public, max-age=' + cacheTime);
        next();
    });
}

// Stylus to CSS compiler on request
app.use('/css', stylus.middleware({
    src: path.join(cwd, config.paths.styles),
    dest: path.join(cwd, config.paths.cache),
    compress: config.isProd,
    sourcemap: !config.isProd
}));

// Static files server
app.use('/css|/js', express.static(path.join(cwd, config.paths.cache)));
app.use('/img', express.static(path.join(cwd, config.paths.img)));
app.use('/js', express.static(path.join(cwd, config.paths.js)));
app.get('/', (req, res) => res.render('index', { dict: lang.dictionary }));

// Default handler
app.use((req, res) => {
    // TODO better error page
    res.status(404).end(lang.dict.backend['404']);
});

// Server Startup
app.listen(config.port);
console.log('listening on port', config.port, 'with tier', config.tier);


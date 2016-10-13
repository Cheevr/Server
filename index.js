var express = require('express');
var path = require('path');
var stylus = require('stylus');

var app = express();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, '../static/views'));

// Stylus to CSS compiler on request
app.use('/css', stylus.middleware({
    src: 'static/styles',
    dest: 'cache',
    compress: process.env.ENV != 'development',
    sourcemap: process.env.ENV == 'development'
}));

// Static files server
app.use('/css|/js', express.static(path.join(__dirname, '../cache')));
app.use('/img', express.static(path.join(__dirname, '../static/img')));
app.use('/js', express.static(path.join(__dirname, '../static/js')));
app.get('/', (req, res) => res.render('index'));

// Debug handler
app.use((err, req, res) => {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: app.get('env') == 'development' ? err : {}
    });
});

// Server Startup
app.listen(8080);
console.log('listening on port 8080');


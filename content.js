var config = require('config');
var express = require('express');
var lang = require('lang');
var path = require('path');
var stylus = require('stylus');


const cwd = path.dirname(require.main.filename);

module.exports = app => {
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
    app.get('/', (req, res) => res.render('index', {dict: lang.dictionary}));
};
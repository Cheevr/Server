var config = require('config');
var express = require('express');
var fs = require('fs');
var lang = require('lang');
var path = require('path');
var Router = require('versioned-api-router');
var stylus = require('stylus');


const cwd = path.dirname(require.main.filename);

module.exports = app => {
    // Convert stylus files to css and place them in cache dir
    let stylesDir = path.isAbsolute(config.paths.styles) ? config.paths.styles :  path.join(cwd, config.paths.styles);
    let cacheDir = path.isAbsolute(config.paths.cache) ? config.paths.cache : path.join(cwd, config.paths.cache);
    let imgDir = path.isAbsolute(config.paths.img) ? config.paths.img : path.join(cwd, config.paths.img);
    let jsDir = path.isAbsolute(config.paths.js) ? config.paths.js : path.join(cwd, config.paths.js);

    fs.existsSync(stylesDir) && app.use('/css', stylus.middleware({
        src: stylesDir,
        dest: cacheDir,
        compress: config.isProd,
        sourcemap: !config.isProd
    }));

    // Serve static files
    fs.existsSync(cacheDir) && app.use('/css|/js', express.static(cacheDir));
    fs.existsSync(imgDir) && app.use('/img', express.static(imgDir));
    fs.existsSync(jsDir) && app.use('/js', express.static(jsDir));
    app.get('/', (req, res) => res.render('index', {dict: lang.dictionary}));

    let routePaths = Array.isArray() ? config.paths.routes : [ config.paths.routes ];
    let router = new Router();
    router.auth = app.auth;
    for (let routePath of routePaths) {
        let dir = path.isAbsolute(routePath) ? routePath : path.join(cwd, routePath);
        if (fs.existsSync(dir)) {
            let files = fs.readdirSync(dir);
            for (let file of files) {
                require(path.join(dir, file))(router);
            }
        }
    }
    app.use(router);

    // File Not Found handler
    app.use((req, res) => {
        res.status(404).render('404', {dict: lang.dictionary.backend});
    });

    // Error handler
    app.use(function (error, req, res, next) {
        console.error(error.stack);
        res.status(500).render('500', { dict: lang.dictionary.backend , error });
    });
};
const browserify = require('browserify');
const config = require('config');
const express = require('express');
const fs = require('fs');
const lang = require('lang');
const metrics = require('./metrics');
const path = require('path');
const Router = require('versioned-api-router');
const stylus = require('stylus');
const uglify = require('uglify-js');


const cwd = path.dirname(require.main.filename);
const viewDir = config.normalizePath(cwd, config.paths.views);
const stylesDir = config.normalizePath(cwd, config.paths.styles);
const imgDir = config.normalizePath(cwd, config.paths.img);
const jsDir = config.normalizePath(cwd, config.paths.js);
const cacheDir = path.isAbsolute(config.paths.cache) ? config.paths.cache : path.join(cwd, config.paths.cache);
viewDir.push(path.join(__dirname, 'static/views'));
stylesDir.push(path.join(__dirname, 'static/styles'));
imgDir.push(path.join(__dirname, 'static/img'));

module.exports = app => {
    // Convert stylus files to css and place them in cache dir
    for (let dir of stylesDir) {
        fs.existsSync(dir) && app.use('/css', stylus.middleware({
            src: dir,
            dest: cacheDir,
            compress: config.isProd,
            sourcemap: !config.isProd
        }));
    }

    // Process all javascript files with browserify and babel
    app.use('/js', processJs());

    // Serve static files
    fs.existsSync(cacheDir) && app.use('/css|/js', express.static(cacheDir));
    let staticConfig = config.isProd ? { maxAge: 86400000 } : {};
    for (let dir of imgDir) {
        fs.existsSync(dir) && app.use('/img', express.static(dir, staticConfig));
    }

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

    // Server view files (pug)
    let existingFiles = {};
    for (let dir of viewDir) {
        fs.existsSync(dir) && app.get('*', (req, res, next) => {
            let file = req.originalUrl.replace(/^\//, '').replace(/\.(pug|html?|php|asp|jsp|py|rb|xml)$/, '');
            if (!file.length) {
                file = path.join(dir, 'index.pug')
            } else {
                file = path.join(dir, file + '.pug');
            }
            if (existingFiles[file] === undefined) {
                existingFiles[file] = fs.existsSync(file);
            }
            if (existingFiles[file]) {
                return res.render(file, {
                    basedir: viewDir,
                    dict: lang.dictionary,
                    user: req.user
                });
            }
            next();
        });
    }

    // Feedback handler
    metrics.feedback(app);

    // File Not Found handler
    app.all('*', (req, res) => {
        res.status(404).render('404', {dict: lang.dictionary.backend});
    });

    // Error handler
    app.use(function (error, req, res, next) {
        console.error(error.stack);
        res.status(500).render('500', { dict: lang.dictionary.backend , error });
    });
};

function processJs() {
    let processed = {};
    let returned = false;
    return (req, res, next) => {
        let file = req.originalUrl.replace(/^\/js\//, '');
        if (processed[file]) {
            return next();
        }
        for (let dir of jsDir) {
            let fullPath = path.join(dir, file);
            if (!fs.existsSync(fullPath)) {
                continue;
            }
            browserify(fullPath, {
                paths: path.join(__dirname, 'static/js'),
                basedir: dir,
                debug: !config.isProd
            }).bundle((err, content) => {
                if (err) {
                    return console.log('Error compiling javascript', err);
                }
                content = lang.process(content.toString('utf8'), req.locale);
                if (config.isProd) {
                    content = uglify.minify(content, {fromString: true}).code;
                }
                fs.writeFileSync(path.join(cacheDir, file), content, 'utf8');
                // TODO will only watch the requested file, not any of the includes
                if (!config.isProd) {
                    for (let entry of [dir, cacheDir]) {
                        fs.watch(path.join(entry, file), {
                            persistent: false,
                            encoding: 'utf8'
                        }, () => processed[file] = processed[file] === undefined);
                    }
                }
                if (!returned) {
                    returned = true;
                    next();
                }
            });
        }
    }
}
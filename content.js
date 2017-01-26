const babelify = require('babelify');
const browserify = require('browserify');
const config = require('cheevr-config');
const express = require('express');
const fs = require('fs');
const lang = require('cheevr-lang');
const Logger = require('cheevr-logging');
const path = require('path');
const Router = require('versioned-api-router');
const stylus = require('stylus');
const uglify = require('uglify-js');
const util = require('util');


const cwd = process.cwd();
const hostname = require('os').hostname();
const application = path.basename(path.dirname(require.main.filename));
const viewDir = config.normalizePath(cwd, config.paths.views);
const stylesDir = config.normalizePath(cwd, config.paths.styles);
const imgDir = config.normalizePath(cwd, config.paths.img);
const jsDir = config.normalizePath(cwd, config.paths.js);
const serverJsDir = path.join(__dirname, 'static/js');
const jsScanInterval = 1000;
const cacheDir = path.isAbsolute(config.paths.cache) ? config.paths.cache : path.join(cwd, config.paths.cache);
const existingViews = {};
const jsProcessed = {};

viewDir.push(path.join(__dirname, 'static/views'));
stylesDir.push(path.join(__dirname, 'static/styles'));
imgDir.push(path.join(__dirname, 'static/img'));

module.exports = app => {
    // TODO if coming from a mobile browser try to load file.mobile.ext first and then fall back to file.ext.

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
    config.isProd || [...jsDir, serverJsDir].forEach(dir => {
        fs.existsSync(dir) && fs.watch(dir, {interval: jsScanInterval, recursive: true}, () => {
            Object.keys(jsProcessed).forEach(prop => delete jsProcessed[prop]);
            clearRecursive(cacheDir, '.js');
        });
    });

    // Serve static files
    let staticConfig = config.isProd ? { maxAge: config.backend.cacheTime } : {};
    fs.existsSync(cacheDir) && app.use('/css|/js', express.static(cacheDir, staticConfig));
    for (let dir of imgDir) {
        fs.existsSync(dir) && app.use('/img', express.static(dir, staticConfig));
    }

    // Replace rendering function to look in multitple locations
    app.use((req, res, next) => {
        let original = res.render;
        res.render = (file, dict = lang.dictionary) => {
            file = String(file);
            file = file.length ? file : 'index';
            for (let dir of viewDir) {
                let fullPath = path.join(dir, file + '.pug');
                if (existingViews[fullPath] === undefined) {
                    existingViews[fullPath] = fs.existsSync(fullPath);
                }
                if (existingViews[fullPath]) {
                    original.call(res, fullPath, {
                        basedir: dir,
                        dict,
                        user: req.user
                    });
                    res.done = true;
                    return res;
                }
            }
            return res;
        };
        next();
    });

    // Include routes from the projects route directory
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

    // Automatically serve view files if they exist.
    app.get('*', (req, res, next) => {
        let file = req.path.replace(/^\//, '').replace(/\.(pug|html?|php|asp|jsp|py|rb|xml)$/, '');
        res.render(file);
        res.done || next();
    });

    // Feedback handler
    feedback(app);

    // File Not Found handler
    app.use((req, res) => {
        res.status(404);
        let acceptType = req.headers['accept'] || '';
        if (acceptType.indexOf('html') !== -1) {
            return res.render(404);
        }
        res.end();
    });

    // Error handler
    app.use(function (error, req, res, next) {
        Logger.server.error(util.format(error));
        res.status(500);
        let acceptType = req.headers['accept'];
        if (acceptType && acceptType.indexOf('html') !== 0) {
            return res.render(500);
        }
        res.end();
    });
};

function clearRecursive(dir, filter) {
    fs.readdir(dir, (err, files) => {
        for (let file of files) {
            let fullPath = path.join(dir, file);
            if (fs.existsSync(fullPath)) {
                let stat = fs.statSync(fullPath);
                if (stat.isDirectory()) {
                    clearRecursive(fullPath, filter);
                } else {
                    path.extname(file) == filter && fs.unlinkSync(fullPath);
                }
            }
        }
    })
}

function processJs() {
    return (req, res, next) => {
        let file = req.originalUrl.replace(/^\/js\//, '');
        let fileProps = path.parse(file);
        req.url = req.url.replace(fileProps.ext, '.' + req.locale + fileProps.ext);

        if (jsProcessed[file]) {
            return next('route');
        }

        let targetFile = path.join(cacheDir, fileProps.dir, fileProps.name + '.' + req.locale + fileProps.ext);
        fs.existsSync(targetFile) && fs.unlinkSync(targetFile);
        let targetDir = path.dirname(targetFile);
        fs.existsSync(targetDir) || fs.mkdirSync(targetDir);
        let returned = false;


        for (let dir of jsDir) {
            let sourceFile = path.join(dir, file);
            if (!fs.existsSync(sourceFile)) {
                continue;
            }

            browserify(sourceFile, {
                paths: serverJsDir,
                basedir: dir,
                debug: !config.isProd
            }).transform(babelify, {
                presets: ['es2015']
            }).bundle((err, content) => {
                if (err) {
                    return console.log('Error compiling javascript', err);
                }
                content = lang.process(content.toString('utf8'), req.locale);
                if (config.isProd) {
                    content = uglify.minify(content, {fromString: true}).code;
                }
                fs.writeFileSync(targetFile, content, 'utf8');
                jsProcessed[file] = true;
                if (!returned) {
                    returned = true;
                    next('route');
                }
            });
        }
    }
}

function feedback(app) {
    app.post('/feedback', app.noauth, (req, res) => {
        let feedback = req.body;
        if (!feedback.message || !feedback.message.length) {
            return res.status(422).end();
        }
        req.user && (feedback.userid = req.user.id);
        feedback.ip = req.ip;
        feedback['@timestamp'] = new Date();
        feedback.tier = config.tier;
        feedback.process = process.pid;
        feedback.hostname = hostname;
        feedback.application = application;
        req.es.index({
            index: 'feedback',
            type: 'entry',
            body: feedback
        }, err => {
            if (err) {
                throw err;
            }
            res.end();
        });
    });
}

var browserify = require('browserify');
var config = require('config');
var express = require('express');
var fs = require('fs');
var lang = require('lang');
var path = require('path');
var Router = require('versioned-api-router');
var stylus = require('stylus');
var uglify = require('uglify-js');


const cwd = path.dirname(require.main.filename);
const viewDir = config.normalizePath(cwd, config.paths.views);
const stylesDir = config.normalizePath(cwd, config.paths.styles);
const imgDir = config.normalizePath(cwd, config.paths.img);
const jsDir = config.normalizePath(cwd, config.paths.js);
const cacheDir = path.isAbsolute(config.paths.cache) ? config.paths.cache : path.join(cwd, config.paths.cache);

module.exports = app => {
    // Convert stylus files to css and place them in cache dir
    for (let dir of stylesDir) {
        fs.existsSync(stylesDir) && app.use('/css', stylus.middleware({
            src: dir,
            dest: cacheDir,
            compress: config.isProd,
            sourcemap: !config.isProd
        }));
    }

    // Replace language placeholders
    for (let dir of jsDir) {
        fs.existsSync(dir) && app.use('/js', processJs());
    }

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
            let file = req.originalUrl.replace(/^\//, '');
            if (!file.length) {
                file = 'index';
            } else {
                let ext = path.extname(file);
                file = path.join(path.dirname(file), path.basename(file, ext));
            }
            if (existingFiles[file] === undefined) {
                existingFiles[file] = fs.existsSync(path.join(dir, file + '.pug'));
            }
            if (existingFiles[file]) {
                res.render(file, {
                    dict: lang.dictionary,
                    user: req.user
                });
            } else {
                next();
            }
        });
    }

    // File Not Found handler
    app.all((req, res) => {
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
                basedir: dir,
                debug: !config.isProd
            }).bundle((err, content) => {
                content = lang.process(content.toString('utf8'), req.locale);
                if (config.isProd) {
                    content = uglify.minify(content, {fromString: true}).code;
                }
                fs.writeFileSync(path.join(cacheDir, file), content, 'utf8');
                processed[file] = true;
                if (!config.isProd) {
                    for (let entry of [dir, cacheDir]) {
                        fs.watch(path.join(entry, file), {
                            persistent: false,
                            encoding: 'utf8'
                        }, () => delete processed[file]);
                    }
                }
                next();
            });
        }
    }
}
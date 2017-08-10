# Cheevr-Server
[![npm version](https://badge.fury.io/js/%40cheevr%2Fserver.svg)](https://badge.fury.io/js/%40cheevr%2Fserver)
[![Build Status](https://travis-ci.org/Cheevr/Server.svg?branch=master)](https://travis-ci.org/Cheevr/Server)
[![Coverage Status](https://coveralls.io/repos/Cheevr/Server/badge.svg?branch=master&service=github)](https://coveralls.io/github/Cheevr/Server?branch=master)
[![Dependency Status](https://david-dm.org/Cheevr/Server.svg)](https://david-dm.org/Cheevr/Server)


# About

This module offers a simple standard and opinionated solution for getting a rest or web server up an running quickly.
The goal is for developers to focus on business logic and have the server itself just have reasonable default
settings for most systems. Here are some of the features/system included:

* Elasticsearch integration with Redis caching
* Internationalization with template integration
* Multi process task runners
* Daily rolling file logs
* Metrics collection into kibana or new relic
* Multi environment configurations with override functionality for local settings
* JSON body parsing
* REST api verification and auto documentation
* Automatic web file caching
* Token based authentication
* Stylus, Pug, ES6 with require.js support


# Installation

```Bash
npm i @cheevr/server
```

# Example

The server is configured with sensible defaults for you to start developing immediately. Set up the server by including
the module in your **index.js**:

```JavaScript
require('@cheevr/server');
```

## REST handler example

To implement your own handlers create a file in your project directory under **routes/example.js**:

```JavaScript
module.exports = Router => {
    Router.get('/example', (req, res) => res.send('Hello World!').end());
}
```

launch the server by running ```node .``` in your project directory and you should be able to query the web server on
post 8000:

```Bash
curl localhost:8000/example
Hello World!
```

## Web Example

To serve static web files you will need to create a few directories for the different types of source to include:

* **static/js** - supports [ES6](http://es6-features.org/) files with [RequireJS](http://requirejs.org/) syntax that will be converted to ES5
* **static/styles** - supports [Stylus](http://stylus-lang.com/) files that will be converted to CSS
* **static/views** - supports [Pug](https://pugjs.org) files that will be converted to HTML files

Create a file at **static/views/index.pug**:

```
html
    head
        title Hello World!
        link(rel="stylesheet" href="css/default.css" type="text/css")
        script(type="text/javascript" src="js/app.js" async)
    body
        p1
            Hello World!
```

Now launch the server by running ```node .``` and directy your browser to http://localhost:8000 to see your "Hello World" message show up.
As you've probably noticed the linked css and js files will not be loaded and might throw errors in the console of your browser.

To fix this create a file called **static/styles/default.styl** with the following content:

```
body
  font-family Verdana
  font-size 12px
  margin 20%
```

Same goes for your javascript source at **static/js/app.js**:

```JavaScript
alert('Hello World!');
```

Both files should now be included if you reload your browser.


# Configuration


# Routes


# Tasks


# Web resources


# Translations


# Feature for future Consideration



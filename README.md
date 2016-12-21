# periodicjs.core.controller
[![Build Status](https://travis-ci.org/typesettin/periodicjs.core.controller.svg?branch=master)](https://travis-ci.org/typesettin/periodicjs.core.controller) [![NPM version](https://badge.fury.io/js/periodicjs.core.controller.svg)](http://badge.fury.io/js/periodicjs.core.controller) [![Coverage Status](https://coveralls.io/repos/github/typesettin/periodicjs.core.controller/badge.svg?branch=master)](https://coveralls.io/github/typesettin/periodicjs.core.controller?branch=master)  [![Join the chat at https://gitter.im/typesettin/periodicjs.core.data](https://badges.gitter.im/typesettin/periodicjs.core.controller.svg)](https://gitter.im/typesettin/periodicjs.core.controller?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

### Description
Core controller is a component of periodicjs.core.controller that exposes a standard set of methods across different transport protcols with options for implementing different API strategies.  With core controller implementing a RESTful API for HTTP requests looks no different than standing up a JSONRPC API for websocket based communications.

### Installation
```sh
$ npm i periodicjs.core.controller
```

### [Full Documentation](https://github.com/typesettin/periodicjs.core.controller/blob/master/doc/api.md)

### Usage (basic)
```javascript

```
### Usage (advanced)
```javascript

```
### Magical .meta Property
```javascript

```
### Development
*Make sure you have grunt installed*
```sh
$ npm i -g grunt-cli jsdoc-to-markdown
```

For generating documentation
```sh
$ grunt doc
$ jsdoc2md lib/**/*.js utility/**/*.js index.js > doc/api.md
```
### Notes
* Check out [https://github.com/typesettin/periodicjs](https://github.com/typesettin/periodicjs) for the full Periodic Documentation

### Testing
```sh
$ npm i
$ grunt test
```
### Contributing
License
----

MIT

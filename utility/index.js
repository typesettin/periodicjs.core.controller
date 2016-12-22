'use strict';
const path = require('path');
const traps = require(path.join(__dirname, './traps'));
const loggers = require(path.join(__dirname, './aliased/aliased_logger'));
const middleware = require(path.join(__dirname, './middleware'));
const protocols = require(path.join(__dirname, './aliased/aliased_protocol'));
const data = require(path.join(__dirname, './aliased/aliased_data'));
const rest = require(path.join(__dirname, './aliased/aliased_rest'));
const deprecate = require(path.join(__dirname, './deprecate'));
const aliased = Object.assign({}, loggers, protocols, data, rest);

module.exports = { traps, aliased, middleware, deprecate };
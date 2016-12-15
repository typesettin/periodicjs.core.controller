'use strict';
const path = require('path');
const traps = require(path.join(__dirname, './traps'));
const loggers = require(path.join(__dirname, './aliased_logger'));
const middleware = require(path.join(__dirname, './middleware'));
const protocols = require(path.join(__dirname, './aliased_protocol'));
const aliased = Object.assign({}, loggers, protocols);

module.exports = { traps, aliased, middleware };
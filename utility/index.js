'use strict';
const path = require('path');
const traps = require('./traps');
const loggers = require('./aliased/aliased_logger');
const middleware = require('./middleware');
const protocols = require('./aliased/aliased_protocol');
const data = require('./aliased/aliased_data');
const rest = require('./aliased/aliased_rest');
const deprecate = require('./deprecate');
const aliased = Object.assign({}, loggers, protocols, data, rest);

module.exports = { traps, aliased, middleware, deprecate };
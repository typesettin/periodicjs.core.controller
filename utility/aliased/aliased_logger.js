'use strict';

var _logError = function (options = {}) {
	return this.protocol.error(options.req, options.res, options);
};

var _logWarning = function (options = {}) {
	return this.protocol.warn(options.req, options.res, options);
};

module.exports = { 
	logError: _logError, 
	logWarning: _logWarning 
};
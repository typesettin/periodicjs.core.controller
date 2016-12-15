'use strict';
const path = require('path');
const wrapWithDeprecationWarning = require(path.join(__dirname, '../deprecate'));

var _logError = function () {
	let fn = function (options = {}) {
		return this.protocol.error(options.req, options.res, { err: options.err });
	};
	let message = 'CoreController.logError: Use CoreController.protocol.error instead';
	return wrapWithDeprecationWarning.call(this, fn, message);
};

var _logWarning = function (options = {}) {
	let fn = function (options = {}) {
		return this.protocol.warn(options.req, options.res, { err: options.err });
	};
	let message = 'CoreController.logWarning: Use CoreController.protocol.warn instead';
	return wrapWithDeprecationWarning.call(this, fn, message);
};

module.exports = { 
	logError: _logError, 
	logWarning: _logWarning 
};
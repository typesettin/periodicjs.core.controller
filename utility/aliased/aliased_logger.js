'use strict';
const path = require('path');
const wrapWithDeprecationWarning = require(path.join(__dirname, '../deprecate'));

/**
 * Logs an error. Alias for CoreController.protocol.error or CoreController.meta.error
 * @return {Function} Returns a function which logs an error using the CoreController logger
 */
var _logError = function () {
	/**
	 * Logs an error
	 * @param  {Object}   options Configurable options for error logging
	 * @param {Object} options.req Express request object
	 * @param {Object} options.res Express response object
	 * @param {Object|string} options.err Error object or an error message
	 */
	let fn = function logError (options = {}) {
		return this.protocol.error(options.req, options.res, { err: options.err });
	};
	let message = 'CoreController.logError: Use CoreController.protocol.error or CoreController.meta.error instead';
	return wrapWithDeprecationWarning.call(this, fn, message);
};

/**
 * Logs a warning. Alias for CoreController.protocol.warn or CoreController.meta.warn
 * @return {Function}         Returns a function which logs warnings using CoreController logger
 */
var _logWarning = function () {
	/**
	 * Logs a warning
	 * @param  {Object}   options Configurable options for warning logging
	 * @param {Object} options.req Express request object
	 * @param {Object} options.res Express response object
	 * @param {Object|string} options.err Error object or an warning message
	 */
	let fn = function logWarning (options = {}) {
		return this.protocol.warn(options.req, options.res, { err: options.err });
	};
	let message = 'CoreController.logWarning: Use CoreController.protocol.warn or CoreController.meta.warn instead';
	return wrapWithDeprecationWarning.call(this, fn, message);
};

module.exports = { 
	logError: _logError, 
	logWarning: _logWarning 
};
'use strict';
const path = require('path');
const pluralize = require('pluralize');
const capitalize = require('capitalize');
const Promisie = require('promisie');
const wrapWithDeprecationWarning = require(path.join(__dirname, '../deprecate'));

/**
 * Creates a function that will resolve a template file path from a set of directories. Alias for CoreController._utility_responder.render
 * @return {Function} A function that will resolve a valid file path for a template
 */
var _getPluginViewDefaultTemplate = function () {
	/**
	 * Get a valid file path for a template file from a set of directories
	 * @param  {Object}   opts     Configurable options (see periodicjs.core.protocols for more details)
	 * @param {string} [opts.extname] Periodic extension that may contain view file
	 * @param {string} opts.viewname Name of the template file
	 * @param {string} [opts.themefileext="periodicjs.theme.default"] Periodic theme that may contain view file
	 * @param {string} [opts.viewfileext=".ejs"] File extension type
	 * @param  {Function} callback Callback function
	 * @return {Object}          Returns a Promise which resolves with file path if cb argument is not passed
	 */
	let fn = function getPluginViewDefaultTemplate (opts = {}, callback) {
		let { extname, viewname, themefileext, viewfileext } = opts;
		let themename = this.theme;
		let fileext = (typeof themefileext === 'string') ? themefileext : viewfileext;
		return this._utility_responder.render({}, Object.assign(opts, { themename, fileext, resolve_filepath: true }), callback);
	};
	let message = 'CoreController.getPluginViewDefaultTemplate: Use CoreController.responder.render with a HTML adapter or CoreController._utility_responder.render instead';
	return wrapWithDeprecationWarning.call(this, fn, message);
};

/**
 * Creates a function that will send a HTTP response or return a formatted response object. Alias for CoreController.protocol.respond
 * @return {Function} A function that will format response data and send a response
 */
var _respondInKind = function () {
	/**
	 * Sends response data to client or returns formatted response data
	 * @param  {Object}   opts     Configurable options (see periodicjs.core.protocols for more details)
	 * @param {Function} opts.callback An optional callback. If this options is defined callback argument will be ignored
	 * @param {*} opts.responseData Data to include in response object. If opts.err is defined this option will be ignored and the response will be treated as an error response
	 * @param {*} opts.err Error data. If this option is defined response will always be an error response unless .ignore_error is true
	 * @param {Object} opts.req Express request object
	 * @param {Object} opts.res Express response object
	 * @param  {Function} [callback] Optional callback function
	 * @return {Function}         If callback is not defined optionally returns a Promise which will resolve response data
	 */
	let fn = function respondInKind (opts = {}, callback) {
		let { req, res, responseData, err } = opts;
		opts.callback = (typeof opts.callback === 'function') ? opts.callback : callback;
		if ((path.extname(req.originalUrl) === '.html' || req.is('html') || req.is('text/html') || path.extname(req.originalUrl) === '.htm') || typeof opts.callback === 'function') {
			return this.protocol.respond(req, res, { data: responseData, err, return_response_data: true })
				.try(result => {
					if (typeof opts.callback === 'function') opts.callback(req, res, result);
					else return Promisie.resolve(result);
				})
				.catch(e => {
					if (typeof opts.callback === 'function') callback(e);
					else return Promisie.reject(e);
				});
		}
		else if (req.redirecturl) {
			req.redirectpath = (!req.redirectpath && req.redirecturl) ? req.redirecturl : req.redirectpath;
			return this.protocol.redirect(req, res);
		}
		else {
			let settings = (this.protocol && this.protocol.settings) ? this.protocol.settings : false;
			if (settings && settings.sessions && settings.sessions.enabled && req.session) req.flash = req.flash.bind(req);
			else req.flash = null;
			return this.protocol.respond(req, res, { data: responseData, err });
		}
	};
	let message = 'CoreController.respondInKind: Use CoreController.protocol.respond with a HTTP adapter instead';
	return wrapWithDeprecationWarning.call(this, fn, message);
};

/**
 * Creates a function that will render a template and send HTTP response to client. Alias for CoreController._utility_responder.render
 * @return {Function} A function that will render a template and send data to client
 */
var _handleDocumentQueryRender = function () {
	/**
	 * Renders a view from template and sends data to client
	 * @param  {Object}   opts     Configurable options (see periodicjs.core.responder for more details)
	 * @param {string} opts.extname Periodic extension which may have template in view folder
	 * @param {string} opts.viewname Name of template file
	 * @param {string} opts.themefileext Periodic theme which may have template in view folder
	 * @param {string} opts.viewfileext The file extension of the view file
	 * @param {Object} opts.req Express request object
	 * @param {Object} opts.res Express response object
	 * @param  {Function} [callback] Optional callback function
	 * @return {Function}          If callback is not defined returns a Promise which resolves with rendered template
	 */
	let fn = function handleDocumentQueryRender (opts = {}, callback) {
		let { extname, viewname, themefileext, viewfileext, responseData } = opts;
		let themename = this.theme;
		let fileext = (typeof themefileext === 'string') ? themefileext : viewfileext;
		return this._utility_responder.render(responseData || {}, Object.assign(opts, { themename, fileext, skip_response: true }))
			.then(result => {
				this.protocol.respond(opts.req, opts.res, {
					responder_override: result
				});
				if (typeof callback === 'function') callback(null, result);
				else return Promisie.resolve(result);
			})
			.catch(e => {
				this.protocol.error(opts.req, opts.res, { err: e });
				if (typeof callback === 'function') callback(e);
				else return Promisie.reject(e);
			});
	};
	let message = 'CoreController.handleDocumentQueryRender: Use CoreController.responder.render with an HTML adapter or CoreController._utility_responder.render instead';
	return wrapWithDeprecationWarning.call(this, fn, message);
};

/**
 * Creates a function that will render an error view from a template. Alias for CoreController._utility_responder.error
 * @return {Function} A function that will render an error view from a template and send response
 */
var _handleDocumentQueryErrorResponse = function () {
	/**
	 * Renders an error view from a template and sends data to client
	 * @param  {Object}   opts Configurable options (see periodicjs.core.responder for more details)
	 * @param {string|Object} opts.err Error details for response
	 * @param {Object} opts.req Express request object
	 * @param {Object} opts.res Express response object
	 * @param  {Function} [callback]   Optional callback function
	 * @return {Object}      If callback is not defined returns a Promise which resolves after response has been sent
	 */
	let fn = function handleDocumentQueryErrorResponse (opts = {}, callback) {
		let { err, req, res } = opts;
		if (opts.use_warning) this.protocol.warn(req, res, { err });
		else this.protocol.error(req, res, { err });
		if (req.query.format === 'json' || req.params.ext === 'json' || path.extname(req.originalUrl) === '.json' || req.is('json') || req.params.callback || req.is('application/json')) {
			return this.protocol.respond(req, res, { err });
		}
		else if (typeof callback === 'function') {
			return this.responder.error(err)
				.then(result => callback(null, result))
				.catch(callback);
		}
		else if (req.redirecturl) {
			req.redirectpath = (!req.redirectpath && req.redirecturl) ? req.redirecturl : req.redirectpath;
			return this.protocol.redirect(req, res);
		}
		else {
			return this._utility_responder.error(err, {})
				.then(result => {
					return this.protocol.respond(req, res, { responder_override: result });
				}, err => {
					return this.protocol.exception(req, res, { err });
				});
		}
	};
	let message = 'CoreController.handleDocumentQueryErrorResponse: Use CoreController.responder.error with an HTML adapter or CoreController._utility_responder.error instead';
	return wrapWithDeprecationWarning.call(this, fn, message);
};

/**
 * Creates a function that will render data from a view put can accept additional data for the template and always send a response. Alias for CoreController.protocol.respond
 * @return {Function} A function that will render a view from a template given template data
 */
var _renderView = function () {
	/**
	 * Renders a view from a template given template data
	 * @param  {Object}   req          Express request object
	 * @param  {Object}   res          Express response object
	 * @param  {string}   viewtemplate File path for the view template. By default render will check if file exists in configured default theme and periodicjs extension as well as the viewname as an absolute path
	 * @param  {Object}   viewdata     Data that should be passed for template render
	 */
	let fn = function renderView(req, res, viewtemplate, viewdata) {
		let themename = this.theme;
		return this._utility_responder.render(viewdata, { viewname: viewtemplate })
			.then(result => {
				return this.protocol.respond(req, res, { responder_override: result });
			}, err => {
				return this.protocol.respond(req, res, { err });
			});
	};
	return fn;
	// let message = 'CoreController.renderView: Use CoreController.responder.render with an HTML adapter or CoreController._utility_responder.render instead';
	// return wrapWithDeprecationWarning.call(this, fn, message);
};

/**
 * Creates a function that will get inflected values from a given string
 * @return {Function} A function that will get inflected values from a given string
 */
var _getViewModelProperties = function () {
	/**
	 * Returns inflected values from a string ie. application => applications, Application, etc.
	 * @param  {Object} options Configurable options
	 * @param {string} options.model_name String that should be inflected
	 * @return {Object}         Object containing inflected values indexed by type of inflection
	 */
	return function getViewModelProperties (options = {}) {
		let model_name = options.model_name;
		let viewmodel = {
			name: model_name,
			name_plural: pluralize(model_name)
		};
		return Object.assign(viewmodel, {
			capital_name: capitalize(model_name),
			page_plural_title: capitalize(viewmodel.name_plural),
			page_plural_count: `${ viewmodel.name_plural }count`,
			page_plural_query: `${ viewmodel.name_plural }query`,
			page_single_count: `${ model_name }count`,
			page_pages: `${ model_name }pages`
		});
	};
};

module.exports = {
	getPluginViewDefaultTemplate: _getPluginViewDefaultTemplate,
	respondInKind: _respondInKind,
	handleDocumentQueryRender: _handleDocumentQueryRender,
	handleDocumentQueryErrorResponse: _handleDocumentQueryErrorResponse,
	renderView: _renderView,
	getViewModelProperties: _getViewModelProperties
};

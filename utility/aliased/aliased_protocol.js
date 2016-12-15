'use strict';
const path = require('path');
const pluralize = require('pluralize');
const capitalize = require('capitalize');
const wrapWithDeprecationWarning = require(path.join(__dirname, '../deprecate'));

var _getPluginViewDefaultTemplate = function () {
	let fn = function getPluginViewDefaultTemplate (opts = {}, callback) {
		let { extname, viewname, themefileext, viewfileext } = opts;
		let themename = theme;
		let fileext = (typeof themefileext === 'string') ? themefileext : viewfileext;
		return this._utility_responder.render({}, Object.assign(opts, { themename, fileext, resolve_filepath: true }), callback);
	};
	let message = 'CoreController.getPluginViewDefaultTemplate: Use CoreController.responder.render with a HTML adapter or CoreController._utility_responder.render instead';
	return wrapWithDeprecationWarning.call(this, fn, message);
};

var _respondInKind = function () {
	let fn = function respondInKind (opts = {}, callback) {
		let { req, res, responseData } = opts;
		opts.callback = (typeof opts.callback === 'function') ? opts.callback : callback;
		if ((path.extname(req.originalUrl) === '.html' || req.is('html') || req.is('text/html') || path.extname(req.originalUrl) === '.htm') || typeof opts.callback === 'function') {
			this.protocol.respond(req, res, { data: responseData, return_response_data: true })
				.then(result => opts.callback(req, res, result))
				.catch(e => this.protocol.error(req, res, { err: e }));
		}
		else if (req.redirecturl) this.protocol.redirect(req, res);
		else this.protocol.respond(req, res, { data: responseData });
	};
	let message = 'CoreController.respondInKind: Use CoreController.protocol.respond with a HTTP adapter instead';
	return wrapWithDeprecationWarning.call(this, fn, message);
};

var _handleDocumentQueryRender = function () {
	let fn = function handleDocumentQueryRender (opts = {}, callback) {
		let { extname, viewname, themefileext, viewfileext } = opts;
		let themename = theme;
		let fileext = (typeof themefileext === 'string') ? themefileext : viewfileext;
		return this._utility_responder.render({}, Object.assign(opts, { themename, fileext }))
			.then(result => {
				this.protocol.respond(opts.req, opts.res, {
					responder_override: result
				});
				if (typeof callback === 'function') callback(null, result);
				else return result;
			})
			.catch(e => {
				this.protocol.error(opts.req, opts.res, { err: e });
				if (typeof callback === 'function') callback(e);
				else return Promise.reject(e);
			});
	};
	let message = 'CoreController.handleDocumentQueryRender: Use CoreController.responder.render with an HTML adapter or CoreController._utility_responder.render instead';
	return wrapWithDeprecationWarning.call(this, fn, message);
};

var _handleDocumentQueryErrorResponse = function () {
	let fn = function handleDocumentQueryErrorResponse (opts = {}, cb) {
		let { err, req, res } = opts;
		if (opts.use_warning) this.protocol.warn(req, res, { err });
		else this.protocol.error(req, res, { err });
		if (req.query.format === 'json' || req.params.ext === 'json' || path.extname(req.originalUrl) === '.json' || req.is('json') || req.params.callback || req.is('application/json')) {
			this.protocol.respond(req, res, { err });
		}
		else if (typeof callback === 'function') {
			this.responder.error(err)
				.then(result => callback(null, result))
				.catch(callback);
		}
		else if (req.redirecturl) this.protocol.redirect(req, res);
		else {
			this._utility_responder.error(err, {})
				.then(result => {
					this.protocol.respond(req, res, { responder_override: result });
				}, err => {
					this.protocol.exception(req, res, { err })
				});
		}
	};
	let message = 'CoreController.handleDocumentQueryErrorResponse: Use CoreController.responder.error with an HTML adapter or CoreController._utility_responder.error instead';
	return wrapWithDeprecationWarning.call(this, fn, message);
};

var _renderView = function () {
	let fn = function renderView (req, res, viewtemplate, viewdata) {
		let { extname, viewname, themefileext, viewfileext } = opts;
		let themename = theme;
		let fileext = (typeof themefileext === 'string') ? themefileext : viewfileext;
		return this._utility_responder.render({}, Object.assign(opts, { themename, fileext }))
			.then(result => {
				this.protocol.respond(req, res, { responder_override: result });
			}, err => {
				this.protocol.respond(req, res, { err });
			});
	};
	let message = 'CoreController.renderView: Use CoreController.responder.render with an HTML adapter or CoreController._utility_responder.render instead';
	return wrapWithDeprecationWarning.call(this, fn, message);
};

var _getViewModelProperties = function () {
	return function (options = {}) {
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

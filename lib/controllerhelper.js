/*
 * periodic
 * http://github.com/typesettin/periodic
 *
 * Copyright (c) 2014 Yaw Joseph Etse. All rights reserved.
 */

'use strict';

var fs = require('fs-extra');
/**
 * A module that represents a extension manager.
 * @{@link https://github.com/typesettin/periodic}
 * @author Yaw Joseph Etse
 * @copyright Copyright (c) 2014 Typesettin. All rights reserved.
 * @license MIT
 * @module config
 * @requires module:fs
 * @requires module:util-extent
 * @throws {Error} If missing configuration files
 * @todo to do later
 */

var logger,appSettings;

var ControllerHelper = function (resources) {
	logger = resources.logger;
	appSettings = resources.settings;
};

ControllerHelper.prototype.getPluginViewDefaultTemplate = function (options, callback) {
	var extname = options.extname || '',
		// themename = options.themename,
		theme = options.theme,
		viewname = options.viewname,
		// themefileext = options.themefileext,
		themetemplatefile = options.themetemplatefile,
		exttemplatefile = options.exttemplatefile;
		// themetemplatefile = path.join(path.resolve(__dirname, '../../content/themes'), themename, 'views', viewname + '.' + themefileext),
		// exttemplatefile = path.join(path.resolve(process.cwd(), './node_modules', extname), 'views', viewname + '.' + themefileext);

	var getExtensionView = function (viewname, callback) {
		if (extname) {
			fs.open(exttemplatefile, 'r', function (err) {
				if (err) {
					callback(err, viewname, null);
				}
				else {
					callback(null, viewname, exttemplatefile);
				}
			});
		}
		else {
			callback(null, viewname, viewname);
		}
	};

	var getThemeView = function (viewname, callback) {
		if (theme) {
			fs.open(themetemplatefile, 'r', function (err) {
				if (err) {
					callback(err, viewname, null);
				}
				else {
					callback(null, viewname, themetemplatefile);
				}
			});
		}
		else {
			callback(null, viewname, viewname);
		}
	};

	getThemeView(viewname, function (err, defaultview, themeview) {
		if (err) {
			getExtensionView(defaultview, function (err, defaultview, extname) {
				if (err) {
					callback(null, defaultview);
				}
				else {
					callback(null, extname);
				}
			});
		}
		else {
			callback(null, themeview);
		}
	});
};

ControllerHelper.prototype.handleDocumentQueryRender = function (options) {
	var res = options.res,
		req = options.req,
		redirecturl = options.redirecturl,
		err = options.err,
		callback = options.callback,
		responseData = options.responseData;

	if (err) {
		this.handleDocumentQueryErrorResponse({
			res: res,
			req: req,
			err: err,
			callback: callback,
			redirecturl: redirecturl
		});
	}
	else {
		responseData.periodic = responseData.periodic || {};
		responseData.periodic.version = appSettings.version;
		responseData.periodic.name = appSettings.name;
		responseData.request = {
			query: req.query,
			params: req.params,
			baseurl: req.baseUrl,
			originalurl: req.originalUrl,
			parsed: req._parsedUrl
		};

		responseData.flash_messages = req.flash();
		if (req.query.format === 'json' || req.params.ext === 'json') {
			res.send(responseData);
		}
		else if (req.query.callback) {
			res.jsonp(responseData);
		}
		else if (options.redirecturl) {
			res.redirect(options.redirecturl);
		}
		else {
			res.render(options.renderView, responseData);
		}
	}
	if (callback) {
		callback();
	}
};

ControllerHelper.prototype.handleDocumentQueryErrorResponse = function (options) {
	var err = options.err,
		errormessage = (typeof options.err === 'string') ? options.err : options.err.message,
		redirecturl = options.redirecturl,
		req = options.req,
		res = options.res,
		callback = options.callback; //,
	// errorFlashMessage = (options.errorflash) ? options.errorflash : errormessage;

	res.status(400);

	logger.error(err.stack);
	logger.error(errormessage, req.url);
	if (req.query.format === 'json') {
		res.send({
			'result': 'error',
			'data': {
				error: errormessage
			}
		});
	}
	else {
		if (options.errorflash !== false) {
			req.flash('error', errormessage);
		}
		if (callback) {
			callback();
		}
		else if (redirecturl) {
			res.redirect(redirecturl);
		}
		else {
			var self = this;
			self.getPluginViewDefaultTemplate({
					viewname: 'home/error404',
					themefileext: appSettings.templatefileextension
				},
				function (err, templatepath) {
					self.handleDocumentQueryRender({
						res: res,
						req: req,
						renderView: templatepath,
						responseData: {
							pagedata: {
								title: 'Not Found'
							},
							user: req.user,
							url: req.url
						}
					});
				}
			);
		}
	}
};

module.exports = ControllerHelper;
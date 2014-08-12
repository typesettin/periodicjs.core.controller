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
var ControllerHelper = function () {
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

module.exports = ControllerHelper;
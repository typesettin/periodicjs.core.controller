/*
 * periodic
 * http://github.com/typesettin/periodic
 *
 * Copyright (c) 2014 Yaw Joseph Etse. All rights reserved.
 */

'use strict';

var fs = require('fs-extra'),
	path = require('path'),
	CoreUtilities = require('periodicjs.core.utilities');
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

var logger,appSettings,theme;

var ControllerHelper = function (resources) {
	logger = resources.logger;
	appSettings = resources.settings;
	theme = resources.settings.theme;
};

ControllerHelper.prototype.getPluginViewDefaultTemplate = function (options, callback) {
	var extname = options.extname || '',
		themename = theme,
		viewname = options.viewname,
		themefileext = options.themefileext,
		themetemplatefile,
		exttemplatefile;
		themetemplatefile = (themename && themefileext) ? path.join(path.resolve(process.cwd(), './content/themes'), themename, 'views', viewname + '.' + themefileext) : false;
		exttemplatefile =  (extname && themefileext) ? path.join(path.resolve(process.cwd(), './node_modules', extname), 'views', viewname + '.' + themefileext) : false;

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
			callback('no extname', viewname, viewname);
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
			callback('no theme', viewname, viewname);
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

ControllerHelper.prototype.loadModel = function (options) {
	var model = options.model,
		docid = options.docid,
		sort = options.sort,
		callback = options.callback,
		population = options.population,
		selection = options.selection,
		query;

	if (CoreUtilities.isValidObjectID(docid)) {
		query = {
			$or: [{
				name: docid
			}, {
				_id: docid
			}]
		};
	}
	else if (options.searchusername) {
		query = {
			$or: [{
				name: docid
			}, {
				username: docid
			}]
		};
	}
	else {
		query = {
			name: docid
		};
	}

	if (population) {
		model.findOne(query).sort(sort).select(selection).populate(population).exec(callback);
	}
	else {
		model.findOne(query).sort(sort).select(selection).exec(callback);
	}
};

ControllerHelper.prototype.searchModel = function (options) {
	var model = options.model,
		query = options.query,
		sort = options.sort,
		offset = options.offset,
		selection = options.selection,
		limit = options.limit,
		callback = options.callback,
		population = options.population;

	sort = (sort) ? sort : '-createdat';
	offset = (offset) ? offset : 0;
	limit = (limit || limit > 200) ? limit : 30;

	if (population) {
		model.find(query).sort(sort).select(selection).limit(limit).skip(offset).populate(population).exec(callback);
	}
	else {
		model.find(query).sort(sort).select(selection).limit(limit).skip(offset).exec(callback);
	}
};

ControllerHelper.prototype.createModel = function (options) {
	var model = options.model,
		newdoc = options.newdoc,
		req = options.req,
		res = options.res,
		successredirect = options.successredirect,
		appendid = options.appendid,
		responseData = {};

	model.create(newdoc, function (err, saveddoc) {
		if (err) {
			this.handleDocumentQueryErrorResponse({
				err: err,
				errorflash: err.message,
				res: res,
				req: req
			});
		}
		else {
			if (req.query.format === 'json' || req.params.ext === 'json') {
				req.flash('success', 'Saved');
				responseData.result = 'success';
				responseData.data = {};
				responseData.data.flash_messages = req.flash();
				responseData.data.doc = saveddoc;
				res.send(responseData);
			}
			else if (appendid) {
				req.flash('success', 'Saved');
				res.redirect(successredirect + saveddoc._id);
			}
			else {
				req.flash('success', 'Saved');
				res.redirect(successredirect);
			}
		}
	});
};

ControllerHelper.prototype.updateModel = function (options) {
	var model = options.model,
		id = options.id,
		updatedoc = options.updatedoc,
		req = options.req,
		res = options.res,
		successredirect = options.successredirect,
		// failredirect = options.failredirect,
		appendid = options.appendid,
		responseData = {},
		updateOperation;

	if (options.removeFromArray) {
		logger.silly('removing array in doc');
		updateOperation = {
			$pull: updatedoc
		};
	}
	else if (options.appendArray) {
		logger.silly('appending array in doc');
		updateOperation = {
			$push: updatedoc
		};
	}
	else {
		logger.silly('updating entire doc');
		updateOperation = {
			$set: updatedoc
		};
	}

	model.findByIdAndUpdate(id, updateOperation, function (err, saveddoc) {
		if (err) {
			this.handleDocumentQueryErrorResponse({
				err: err,
				errorflash: err.message,
				res: res,
				req: req
			});
		}
		else {
			if (req.query.format === 'json' || req.params.ext === 'json') {
				req.flash('success', 'Saved');
				responseData.result = 'success';
				responseData.data = {};
				responseData.data.flash_messages = req.flash();
				if (options.population) {
					model.findOne({
						_id: saveddoc._id
					}).populate(options.population).exec(function (err, popdoc) {
						if (err) {
							responseData.data.docpopulationerror = err;
							responseData.data.status = 'couldnt populate';
							responseData.data.doc = saveddoc;
							res.send(responseData);
						}
						else {
							responseData.data.doc = popdoc;
							res.send(responseData);
						}
					});
				}
				else {
					responseData.data.doc = saveddoc;
					res.send(responseData);
				}
			}
			else if (appendid) {
				req.flash('success', 'Saved');
				res.redirect(successredirect + saveddoc._id);
			}
			else {
				req.flash('success', 'Saved');
				res.redirect(successredirect);
			}
			//save revision
			var changesetdata = updatedoc;
			if (changesetdata.docid) {
				delete changesetdata.docid;
			}
			if (changesetdata._csrf) {
				delete changesetdata._csrf;
			}
			if (changesetdata.save_button) {
				delete changesetdata.save_button;
			}
			if (options.saverevision) {
				model.findByIdAndUpdate(
					id, {
						$push: {
							'changes': {
								changeset: updatedoc
							}
						}
					},
					// {safe: true, upsert: true},
					function (err) {
						if (err) {
							logger.error(err);
						}
					}
				);
			}
		}
	});
};

ControllerHelper.prototype.deleteModel = function (options) {
	var model = options.model,
		deleteid = options.deleteid,
		// req = options.req,
		// res = options.res,
		callback = options.callback;

	model.remove({
		_id: deleteid
	}, callback);
};

module.exports = ControllerHelper;
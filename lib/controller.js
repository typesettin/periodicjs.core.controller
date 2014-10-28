/*
 * periodic
 * http://github.com/typesettin/periodic
 *
 * Copyright (c) 2014 Yaw Joseph Etse. All rights reserved.
 */

'use strict';

var fs = require('fs-extra'),
	path = require('path'),
	Utilities = require('periodicjs.core.utilities'),
	CoreUtilities;

var logger, appSettings, theme;

/**
 * A core constructor that provides numerous controller helper functions.
 * @{@link https://github.com/typesettin/periodicjs.core.controller}
 * @author Yaw Joseph Etse
 * @constructor
 * @copyright Copyright (c) 2014 Typesettin. All rights reserved.
 * @license MIT
 * @requires module:fs-extra
 * @requires module:path
 * @requires module:periodicjs.core.utilities
 * @param {object} resources variable injection from resources from instantiated periodic express app
 */
var Controller = function (resources) {
	logger = resources.logger;
	appSettings = resources.settings;
	theme = resources.settings.theme;
	CoreUtilities = new Utilities(resources);
};

/**
 * Gets the path to the view file specified, first look at custom theme views, then extension views, then default views
 * @param  {object}   options  extname, themename, themefileext - support custom theme files
 * @param  {Function} callback async callback
 * @return {Function}            async callback(err,viewname)
 */
Controller.prototype.getPluginViewDefaultTemplate = function (options, callback) {
	var extname = options.extname || '',
		themename = theme,
		viewname = options.viewname,
		themefileext = options.themefileext,
		themetemplatefile,
		exttemplatefile;
	themetemplatefile = (themename && themefileext) ? path.join(path.resolve(process.cwd(), './content/themes'), themename, 'views', viewname + '.' + themefileext) : false;
	exttemplatefile = (extname && themefileext) ? path.join(path.resolve(process.cwd(), './node_modules', extname), 'views', viewname + '.' + themefileext) : false;

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

/**
 * default response handler for express views, or will redirect to another request
 * @param  {object} options res,req,redirecturl,err,callback,responseData - this is what's sent to the rendered template view, also appends http request information like base url, query string parameters, etc
 * @return {object} response object render or callback
 */
Controller.prototype.handleDocumentQueryRender = function (options) {

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
		else if (req.is('json') || req.is('application/json')) {
			res.json(responseData);
		}
		else {
			res.render(options.renderView, responseData);
		}
	}
	if (callback) {
		callback();
	}
};

/**
 * default response handler for error, or will redirect with flash error set
 * @param  {object} options err,req,res,callback
 * @return {object} response object render or callback
 */
Controller.prototype.handleDocumentQueryErrorResponse = function (options) {
	var err = options.err,
		errormessage = (typeof options.err === 'string') ? options.err : options.err.message,
		redirecturl = options.redirecturl,
		req = options.req,
		res = options.res,
		callback = options.callback; //,
	// errorFlashMessage = (options.errorflash) ? options.errorflash : errormessage;

	if (res.statusCode !== 200 || res.statusCode !== 400) {
		res.status(res.statusCode);
	}
	else {
		res.status(400);
	}


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

/**
 * short hand mongoose load document query
 * @param  {object} options model,docid - id or name,callback,population -mongoose population, selection - mongoose selection
 * @return {Function} callback(err,document)
 */
Controller.prototype.loadModel = function (options) {
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

/**
 * short hand mongoose search documents query
 * @param  {object} options model,query - mongoose query,callback,population -mongoose population, selection - mongoose selection , limit, offset
 * @return {Function} callback(err,documents)
 */
Controller.prototype.searchModel = function (options) {
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
	limit = (limit) ? limit : 500;

	if (population) {
		model.find(query).sort(sort).select(selection).limit(limit).skip(offset).populate(population).exec(callback);
	}
	else {
		model.find(query).sort(sort).select(selection).limit(limit).skip(offset).exec(callback);
	}
};

/**
 * short hand mongoose create document query
 * @param  {object} options model,newdoc - document to insert, req, res,callback, successredirect, appendid - append the id of newly created document on redirect
 * @return {object} responseData or redirected page
 */
Controller.prototype.createModel = function (options) {
	var model = options.model,
		newdoc = options.newdoc,
		req = options.req,
		res = options.res,
		callback = options.callback,
		successredirect = options.successredirect,
		appendid = options.appendid,
		responseData = {};

	model.create(newdoc, function (err, saveddoc) {
		if (err) {

			if (callback) {
				callback(null, saveddoc);
			}
			else {

				this.handleDocumentQueryErrorResponse({
					err: err,
					errorflash: err.message,
					res: res,
					req: req
				});
			}
		}
		else {
			if (callback) {
				callback(null, saveddoc);
			}
			else if (req.query.format === 'json' || req.params.ext === 'json') {
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
	}.bind(this));
};

var returnObjectDifference = function (original, revision) {
	var changesetdata = {},
		comparestatus;
	for (var prop in revision) {
		if (!original[prop] || (JSON.stringify(revision[prop]) !== JSON.stringify(original[prop]))) {
			if (Array.isArray(revision[prop]) && original[prop]) {
				for (var op = 0; op < revision[prop].length; op++) {
					if (original[prop][op] && original[prop][op]._id && revision[prop][op].toString() === original[prop][op]._id.toString()) {
						comparestatus = 'array of prop(' + prop + ') is same';
					}
					else if (
						original[prop][op] &&
						original[prop][op].entity_item &&
						revision[prop][op].entity_item &&
						revision[prop][op].entity_item.toString() === original[prop][op].entity_item._id.toString()
					) {
						comparestatus = 'array entity_item of prop(' + prop + ') is the same';
					}
					else if (
						original[prop][op] &&
						original[prop][op].entity_collection &&
						revision[prop][op].entity_collection &&
						revision[prop][op].entity_collection.toString() === original[prop][op].entity_collection._id.toString()
					) {
						comparestatus = 'array entity_collection of prop(' + prop + ') is same';
					}
					else if (
						original[prop][op] &&
						original[prop][op].item &&
						revision[prop][op].item &&
						revision[prop][op].item.toString() === original[prop][op].item._id.toString()
					) {
						comparestatus = 'array item of prop(' + prop + ') is same';
					}
					else {
						comparestatus = 'array prop(' + prop + ') is different';
						changesetdata[prop] = revision[prop];
					}
				}
			}
			else if (original[prop] && original[prop]._id && (original[prop]._id.toString() === revision[prop].toString())) {
				comparestatus = ' prop(' + prop + ') id is the same';
			}
			else {
				comparestatus = ' prop(' + prop + ') id is different';
				changesetdata[prop] = revision[prop];
			}
		}
	}
	logger.silly('changesetdata', changesetdata);
	return changesetdata;
};

/**
 * short hand mongoose update document query
 * @param  {object} options model, id - objectid of mongoose document,updatedoc - document to update, req, res,callback, successredirect, appendid - append the id of newly created document on redirect, removefromarray - sets the update operation to manipulate an array of documents with mongo $pull, appendArray - sets the update operation to manipulate an array of documents with mongo $push, saverevision - save revisions
 * @return {object} responseData or redirected page
 */
Controller.prototype.updateModel = function (options) {
	var model = options.model,
		id = options.id,
		updatedoc = options.updatedoc,
		req = options.req,
		res = options.res,
		callback = options.callback,
		successredirect = options.successredirect,
		originalrevision = options.originalrevision,
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

	if (options.forceupdate) {
		model.update({
			_id: id
		}, updateOperation, function (err, numAffected) {
			if (err) {
				if (callback) {
					callback(err, null);
				}
				else {
					this.handleDocumentQueryErrorResponse({
						err: err,
						errorflash: err.message,
						res: res,
						req: req
					});
				}
			}
			else {
				if (callback) {
					callback(null, numAffected);
				}
				else if (req.query.format === 'json' || req.params.ext === 'json') {
					req.flash('success', 'Saved');
					responseData.result = 'success';
					responseData.data = {
						numAffected: numAffected
					};
					responseData.data.flash_messages = req.flash();
					res.send(responseData);
				}
				else {
					req.flash('success', 'Saved');
					res.redirect(successredirect);
				}
			}
		});
	}
	else {
		model.findByIdAndUpdate(id, updateOperation, function (err, saveddoc) {
			console.log('tried to save', updateOperation);
			if (err) {
				if (callback) {
					callback(err, null);
				}
				else {
					this.handleDocumentQueryErrorResponse({
						err: err,
						errorflash: err.message,
						res: res,
						req: req
					});
				}
			}
			else {
				if (callback) {
					callback(null, saveddoc);
				}
				else if (req.query.format === 'json' || req.params.ext === 'json') {
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
				if (options.saverevision && originalrevision) {
					var changesetdata = updatedoc,
						changesetdiff;
					delete changesetdata.docid;
					delete changesetdata._csrf;
					delete changesetdata.save_button;
					delete changesetdata.changes;
					delete originalrevision.changes;
					delete changesetdata._wysihtml5_mode;
					delete changesetdata.doctypename;
					delete changesetdata.doctypenamelink;
					delete changesetdata.time;
					delete changesetdata.searchdocumentsbutton;
					delete changesetdata.date;
					delete changesetdata.mediafiles;

					changesetdiff = returnObjectDifference(originalrevision, changesetdata);
					if (Object.keys(changesetdiff).length > 0) {
						model.findByIdAndUpdate(
							id, {
								$push: {
									'changes': {
										changeset: changesetdiff,
										editor: req.user._id,
										editor_username: req.user.username
									}
								}
							}, // // {safe: true, upsert: true},
							function (err) {
								if (err) {
									logger.error(err);
								}
							}
						);
					}
					else {
						logger.silly('no changes to save');
					}
				}
			}
		}.bind(this));
	}
};

/**
 * short hand mongoose delete document query
 * @param  {object} options model,deleteid - id to delete,callback
 * @return {Function} callback(err)
 */
Controller.prototype.deleteModel = function (options) {
	var model = options.model,
		deleteid = options.deleteid,
		// req = options.req,
		// res = options.res,
		callback = options.callback;

	model.remove({
		_id: deleteid
	}, callback);
};

module.exports = Controller;

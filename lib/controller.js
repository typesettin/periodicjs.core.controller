/*
 * periodic
 * http://github.com/typesettin/periodic
 *
 * Copyright (c) 2014 Yaw Joseph Etse. All rights reserved.
 */

'use strict';

var fs = require('fs-extra'),
	path = require('path'),
	async = require('async'),
	Utilities = require('periodicjs.core.utilities'),
	CoreUtilities,
	useCache = (global.CoreCache && global.CoreCache.status ==='active')? true: false,
	logger, appSettings, theme, applocals;

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
	if(resources.app && resources.app.locals){
		applocals = resources.app.locals;		
	}
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
			fs.open(exttemplatefile, 'r', function (err,fd) {
				if(fd){
					fs.close(fd);
				}
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
			fs.open(themetemplatefile, 'r', function (err,fd) {
				if(fd){
					fs.close(fd);
				}
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
		renderview = options.renderView,
		responseData = options.responseData,
		cachetype,
		cachekey,
		cachedView,
		useCacheTest = (useCache && req.headers.periodicCache!=='no-periodic-cache'),
		renderResponseData = function(rendererror){
			// console.log('this is rendererror',rendererror);
			if(rendererror){
				err = rendererror;
			}
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
					res.render(renderview, responseData,function(err,renderedview){
						if(err){
							logger.error(err);
							res.status(500);
							res.render(appSettings.customThemeView, {
								message: err.message,
								error: err
							});
							res.end();
						}
						else if(useCacheTest && global.CoreCache){
							global.CoreCache.ViewCache.set({key:cachekey,val:renderedview},function(err){
								if(err){
									logger.error(err);
									res.status(500);
									res.render(appSettings.customThemeView, {
										message: err.message,
										error: err
									});
									res.end();
								}
								else{
									logger.silly('saved cached ',cachekey);
    							res.send(renderedview);
								}
							});
						}
						else{
							res.send(renderedview);
						}
					});
				}
			}
			if (callback) {
				callback();
			}
		}.bind(this),
		getPageView = function(err){
	    if(err){
				renderResponseData(err);
	    }
	    else if(applocals){
				async.applyEach(
					applocals.additionalHTMLFunctions, 
					{req:req,res:res}, 
					function(asyncerr){
						if(asyncerr){
							this.handleExceptionError(asyncerr,req,res);
						}
						else{
							renderResponseData();
						}
				}.bind(this));	
	    }
	    else{
				renderResponseData();
	    }
		}.bind(this);

    if(req.session && req.session.themename && renderview && theme){
    	renderview = renderview.replace(theme,req.session.themename);
    }

    if(useCacheTest && global.CoreCache){
    	cachetype = global.CoreCache.ViewCache.type;
    	cachekey = global.CoreCache.generateKeyFromRequestUrl(cachetype,req.originalUrl);
    	cachedView = global.CoreCache.ViewCache.get({key:cachekey},function(err,cachedViewData){
    		if(cachedViewData){
    			res.set('X-Periodic-Cache','hit');
    			res.send(cachedViewData);
    		}
    		else{
    			res.set('X-Periodic-Cache','miss');
    			getPageView();
    		}
    	});
    }
    else{
    	getPageView(err);
    }
};

Controller.prototype.handleExceptionError = function (err, req, res) {
	if (req.xhr) {
		res.send(500, {
			error: 'Something blew up!'
		});
	}
	else {
		res.status(500);
		// if(appconfig.settings().theme)
		res.render('home/error500', {
			message: err.message,
			error: err
		});
	}
};

/**
 * default response handler for error, or will redirect with flash error set
 * @param  {object} options err,req,res,callback
 * @return {object} response object render or callback
 */
Controller.prototype.handleDocumentQueryErrorResponse = function (options) {
	var err = options.err,
		errormessage = (typeof options.err === 'string' || typeof options.err.toString() === 'string') ? options.err : options.err.message,
		redirecturl = options.redirecturl,
		req = options.req,
		res = options.res,
		callback = options.callback; //,
	// errorFlashMessage = (options.errorflash) ? options.errorflash : errormessage;

	if (res.statusCode !== 200 && res.statusCode !== 400) {
		res.status(res.statusCode);
	}
	else {
		res.status(400);
	}


	if(err.stack){
		logger.error(err.stack);
	}
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
 * short hand method for rendering views
 * @param  {object} req          [description]
 * @param  {object} res          [description]
 * @param  {object} viewtemplate [description]
 * @param  {object} viewdata     [description]
 * @return {object}              [description]
 */
Controller.prototype.renderView = function(req,res,viewtemplate,viewdata){
	this.getPluginViewDefaultTemplate(viewtemplate,
		function (err, templatepath) {
			this.handleDocumentQueryRender({
				res: res,
				req: req,
				err: err,
				renderView: templatepath,
				responseData: viewdata
			});
		}.bind(this)
	);
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
		query,
		cached = (typeof options.cached === 'boolean' && options.cached===true) && true,
		useCacheTest = (useCache && cached),
		cachetype = (global.CoreCache) ? global.CoreCache.DataCache.type : null,
		cachekey = (global.CoreCache) ? global.CoreCache.generateKeyFromRequestUrl(cachetype,model.modelName+'+'+docid) : null,
		cachedData,
		cachekeyexpirename = model.modelName.toLowerCase()+'_doc_cache_expires',
		// cachedDataDoc,
		queryCallback = function(err,doc){
			if(useCacheTest && global.CoreCache && doc){
				console.log('cachekeyexpirename',cachekeyexpirename,global.CoreCache.options[cachekeyexpirename]);
				global.CoreCache.DataCache.set({
						key:cachekey,
						val:doc,
						expires:global.CoreCache.options[cachekeyexpirename]
					},function(err,expires){
						if(err){
							logger.error(err);
						}
						logger.silly('cached',cachekey,'expires',expires);
					});

				callback(err,doc);
			}
			else{
				callback(err,doc);
			}
		},
		getDataQuery = function(){
			if (population) {
				model.findOne(query).sort(sort).select(selection).populate(population).exec(queryCallback);
			}
			else {
				model.findOne(query).sort(sort).select(selection).exec(queryCallback);
			}	
		};

	// console.log('loadModel cached',cached);


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

	if(useCacheTest && global.CoreCache){
		cachedData = global.CoreCache.DataCache.get(
			{ 
				key:cachekey 
			},
			function(err,cachedDataDoc){
	  		if(cachedDataDoc){
	  			logger.silly('X-Periodic-Data-Cache','hit',cachekey);
	  			callback(null,cachedDataDoc);
	  		}
	  		else{
	  			logger.silly('X-Periodic-Data-Cache','miss',cachekey);
					getDataQuery();
	  		}
	  	});
	}
	else{
		getDataQuery();
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
		population = options.population,
		cached = (typeof options.cached === 'boolean' && options.cached===true) && true,
		useCacheTest = (useCache && cached),
		cachetype = (global.CoreCache)? global.CoreCache.DataCache.type : null,
		cachekey,
		cachedData,
		cachekeyexpirename = model.modelName.toLowerCase()+'_doc_cache_expires',
		queryDocsCallback = function(err,documents){
			// console.log('cachekeyexpirename',cachekeyexpirename,global.CoreCache.options[cachekeyexpirename]);
			if(useCacheTest && global.CoreCache && documents){
				global.CoreCache.DataCache.set({
						key:cachekey,
						val:documents,
						expires:global.CoreCache.options[cachekeyexpirename]
					},function(err,expires){
						if(err){
							logger.error(err);
						}
						logger.silly('cached',cachekey,'expires',expires);
					});

				callback(err,documents);
			}
			else{
				callback(err,documents);
			}
		},
		getDocsDataQuery = function(){
				if (population) {
					model.find(query).sort(sort).select(selection).limit(limit).skip(offset).populate(population).exec(queryDocsCallback);
				}
				else {
					model.find(query).sort(sort).select(selection).limit(limit).skip(offset).exec(queryDocsCallback);
				}
		};

	sort = (sort) ? sort : '-createdat';
	offset = (offset) ? offset : 0;
	limit = (limit) ? limit : 500;
	if(global.CoreCache){
		cachekey = global.CoreCache.generateKeyFromRequestUrl(cachetype,model.modelName+'+'+JSON.stringify(query)+'+'+sort+'+'+offset+'+'+selection+'+'+limit+'+'+population);
	}

	if(useCacheTest && global.CoreCache){
		cachedData = global.CoreCache.DataCache.get(
			{ 
				key:cachekey 
			},
			function(err,cachedDataDoc){
	  		if(cachedDataDoc){
	  			logger.silly('X-Periodic-Data-Cache','hit',cachekey);
	  			callback(null,cachedDataDoc);
	  		}
	  		else{
	  			logger.silly('X-Periodic-Data-Cache','miss',cachekey);
					getDocsDataQuery();
	  		}
	  	});
	}
	else{
		getDocsDataQuery();
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
		responseData = {},
		cached = (typeof options.cached === 'boolean' && options.cached===true) && true,
		useCacheTest = (useCache && cached);

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

			if(useCacheTest){
				clearModelDocCache({model:model,doc:saveddoc});
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

var clearModelDocCache = function(options){
	var cachetype,
		// req= options.req,
		doc = options.doc,
		model = options.model,
		datacachetype = global.CoreCache.DataCache.type,
		datacachekey_byid,
		datacachekey_byname,
		asyncDeleteFunctions=[],
		deleteKeysArray=[],
		deleteViewKeyFunction = function(delkey){
			return function(cb) {
				global.CoreCache.ViewCache.del({key:delkey},cb);
			};
		},
		getKeyURLFromCacheModelOptions = function(modelroute,id){
			var delkey =  '/'+path.join(modelroute.replace(':id',id));
			return global.CoreCache.generateKeyFromRequestUrl(cachetype,delkey);
		},
		deleteDataCache = function(){
			if(doc.id){
				datacachekey_byid = global.CoreCache.generateKeyFromRequestUrl(datacachetype,model.modelName+'+'+doc.id);
				global.CoreCache.DataCache.del({key:datacachekey_byid},function(err,status){
					logger.silly('deleted memory cache',datacachekey_byid,status);
				});
			}
			if(doc.name){
				datacachekey_byname = global.CoreCache.generateKeyFromRequestUrl(datacachetype,model.modelName+'+'+doc.name);

				global.CoreCache.DataCache.del({key:datacachekey_byname},function(err,status){
					logger.silly('deleted memory cache',datacachekey_byname,status);
				});
			}
		},
		deleteViewCache = function(options){
			// console.log('deleteViewCache options',options);
			var doccache = options.doccache,
				doclistcache = options.doclistcache,
				docid = options.docid,
				docname = options.docname;//,
				// reqdoc = options.reqdoc;

			if(doccache && doccache.length >0 /* && reqdoc */){
				for(var gcid in doccache){
					if(docname){
						deleteKeysArray.push(getKeyURLFromCacheModelOptions(doccache[gcid],docname));		
					}
					deleteKeysArray.push(getKeyURLFromCacheModelOptions(doccache[gcid],docid));		
				}
			}
			if(doclistcache && doclistcache.length >0 && docname /* && reqdoc */){
				for(var gcil in doclistcache){
					deleteKeysArray.push(getKeyURLFromCacheModelOptions(doclistcache[gcil],docname));		
				}
			}
		};
	cachetype = global.CoreCache.ViewCache.type;

	deleteDataCache();
	// if(req && req.controllerData){
		// console.log('req.controllerData',req.controllerData);
	deleteViewCache({
		doccache : global.CoreCache.options[model.modelName.toLowerCase()+'_doc_cache'],
		doclistcache : global.CoreCache.options[model.modelName.toLowerCase()+'_list_cache'],
		docid : doc.id,
		docname : doc.name//,
		// reqdoc : req.controllerData[model.modelName.toLowerCase()]
	});
	// }
	if(deleteKeysArray.length>0){
		for(var y in deleteKeysArray){
			asyncDeleteFunctions.push(deleteViewKeyFunction(deleteKeysArray[y]));
		}	
		async.series(asyncDeleteFunctions,function(err){
			if(err){
				logger.error(err);
			}
			logger.silly('cleared cache for ',deleteKeysArray);
		});
	}
	// console.log('deleteKeysArray',deleteKeysArray);
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
		updateOperation,
		cached = (typeof options.cached === 'boolean' && options.cached===true) && true,
		useCacheTest = (useCache && global.CoreCache && cached && req.headers.periodicCache!=='no-periodic-cache');

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

				if(useCacheTest){
					updatedoc.id = id;
					clearModelDocCache({model:model,doc:updatedoc,req:req});
				}
			}
		});
	}
	else {
		model.findByIdAndUpdate(id, updateOperation, function (err, saveddoc) {
			// console.log('tried to save', updateOperation);
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
				//refresh cache
				if(useCacheTest){
					updatedoc.id = id;
					clearModelDocCache({model:model,doc:updatedoc,req:req});
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
		callback = options.callback,
		cached = (typeof options.cached === 'boolean' && options.cached===true) && true,
		useCacheTest = (useCache && cached && global.CoreCache);

	model.remove({
		_id: deleteid
	}, callback);

	if(useCacheTest){
		// updatedoc.id = id;
		clearModelDocCache({
			model:model,
			doc:{
				id:deleteid
			}
		});
	}
};

module.exports = Controller;
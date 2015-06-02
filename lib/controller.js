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
	str2json = require('string-to-json'),
	Utilities = require('periodicjs.core.utilities'),
	pluralize = require('pluralize'),
	moment = require('moment'),
	CoreUtilities,
	Item,
	Category,
	Tag,
	User,
	Contenttypes,
	useCache = (global.CoreCache && global.CoreCache.status ==='active')? true: false,
	logger, appSettings, theme, applocals, controllerOptions, mongoose, periodicResources;

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
var Controller = function (resources,options) {
	periodicResources = resources;
	logger = resources.logger;
	appSettings = resources.settings;
	theme = resources.settings.theme;
	controllerOptions = options;
	mongoose = resources.mongoose;
	Item = mongoose.model('Item');
	Contenttypes = mongoose.model('Contenttype');
	Category = mongoose.model('Category');
	Tag = mongoose.model('Tag');
	User = mongoose.model('User');
	pluralize.addIrregularRule('data','datas');

	if(resources.app && resources.app.locals){
		applocals = resources.app.locals;		
	}
	CoreUtilities = new Utilities(resources);
};

String.prototype.capitalizeFirstLetter = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
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

Controller.prototype.respondInKind=function(options){
	var req = options.req,
		res = options.res,
		err = options.err,
		responseData = options.responseData,
		callback = options.callback;

	responseData.periodic = responseData.periodic || {};
	responseData.periodic.version = appSettings.version;
	responseData.periodic.name = appSettings.name;
	responseData.request = {
		query: req.query,
		params: req.params,
		baseurl: req.baseUrl,
		originalurl: req.originalUrl,
		parsed: req._parsedUrl,
		'x-forwarded-for': req.headers['x-forwarded-for'],
		remoteAddress: req.connection.remoteAddress,
		originalUrl: req.originalUrl,
		headerHost: req.headers.host
	};
	if(err){
		responseData.status = 'error';
		responseData.result = 'error';
		responseData.data = {
			error:err
		};
	}

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
		callback(req,res,responseData);
	}
};

Controller.prototype.logError = function(options){
	var err = options.err,
	req = options.req,
	errormeta = {
		err:err
	};
	if(req){
		errormeta.ipinfo = {
			'x-forwarded-for': req.headers['x-forwarded-for'],
			remoteAddress: req.connection.remoteAddress,
			originalUrl: req.originalUrl,
			headerHost: req.headers.host
		};
	}
	logger.error(err.message,err.stack,errormeta);
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
				Controller.prototype.respondInKind({
					req : req,
					res : res,
					responseData : responseData,
					callback:function(req,res,responseData){
						res.render(renderview, responseData,function(err,renderedview){
							if(err){
								Controller.prototype.logError({
									err:err,
									req:req
								});
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
										Controller.prototype.logError({
											err:err,
											req:req
										});
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
				});
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
		errormessage,
		redirecturl = options.redirecturl,
		req = options.req,
		res = options.res,
		callback = options.callback; //,
	// errorFlashMessage = (options.errorflash) ? options.errorflash : errormessage;

	if (typeof options.err === 'string'){
		errormessage = options.err;
	}
	else if (typeof options.err.toString() === 'string'){
		errormessage = options.err.toString();
	}
	else{
		errormessage = options.err.message;
	}
	// else if (typeof options.err === 'string' || typeof options.err.toString() === 'string') ? options.err.toString() : options.err.message


	if (res.statusCode !== 200 && res.statusCode !== 400) {
		res.status(res.statusCode);
	}
	else {
		res.status(400);
	}

	// console.log('errormessage',errormessage,typeof errormessage);
	if(res.statusCode===404){
		logger.debug(errormessage, req.url);
	}
	else{
		if(err.stack){
			logger.error(errormessage,err,{
				ipinfo:{
					'x-forwarded-for': req.headers['x-forwarded-for'],
					originalUrl: req.originalUrl,
					remoteAddress: req.connection.remoteAddress,
					headerHost: req.headers.host
				}
			});
		}
	}

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
				logger.debug('cachekeyexpirename',cachekeyexpirename,global.CoreCache.options[cachekeyexpirename]);
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
				callback(err, saveddoc);
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
				if(arguments.length >=2){
					delete arguments['0'];
					callback(null, arguments);
				}
				else{
				callback(null, saveddoc);
				}
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

Controller.prototype.updateMultipleModel = function(options){
	logger.warn('cached documents not clearing and revisions on multple documents not saved');
	var model = options.model,
		// id = options.id,
		updatequery = options.updatequery,
		updateattributes = options.updateattributes,
		req = options.req,
		res = options.res,
		callback = options.callback,
		successredirect = options.successredirect,
		// originalrevision = options.originalrevision,
		// appendid = options.appendid,
		responseData = {};//,
		// updateOperation,
		// cached = (typeof options.cached === 'boolean' && options.cached===true) && true,
		// useCacheTest = (useCache && global.CoreCache && cached && req.headers.periodicCache!=='no-periodic-cache');

		model.update(updatequery, updateattributes,  { multi: true }, function (err, numAffected) {
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

				// if(useCacheTest){
				// 	updatedoc.id = id;
				// 	clearModelDocCache({model:model,doc:updatedoc,req:req});
				// }
			}
		});
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

Controller.prototype.getViewTemplate = function(options){
	var viewtemplate, 
		model_name = options.model_name;
	viewtemplate = {
		viewname: model_name+'/'+options.model_view_name,
		viewfileext: options.viewfileext || appSettings.templatefileextension
	};

	if(options.extname){
		viewtemplate.extname = options.extname; 
	}

	return viewtemplate;
};

Controller.prototype.getViewModelProperties = function(options){
	var model_name = options.model_name,
		viewmodel = { 
			name : model_name, //item
			name_plural : pluralize(model_name) //items
		};

	viewmodel.capital_name = viewmodel.name.capitalizeFirstLetter(); //Item
	viewmodel.page_plural_title = viewmodel.name_plural.capitalizeFirstLetter(); //  'Items'
	viewmodel.page_plural_count = viewmodel.name_plural+'count'; //  'itemscount'
	viewmodel.page_plural_query = viewmodel.name_plural+'query'; //  'itemsquery'
	viewmodel.page_single_count = viewmodel.name+'count'; //  'itemcount'
	viewmodel.page_pages = viewmodel.name+'pages'; //  'itempages'

	return viewmodel;
};

Controller.prototype.controller_routes = function(options){
	var viewmodel = Controller.prototype.getViewModelProperties(options),
		routesObject = {
			show: Controller.prototype.controller_show(options),
			index: Controller.prototype.controller_index(options),
			create: Controller.prototype.controller_create(options),
			update: Controller.prototype.controller_update(options),
			remove: Controller.prototype.controller_remove(options),
		};
	routesObject['loadFull'+viewmodel.capital_name+'Data'] = Controller.prototype.controller_handle_full_model_data; //loadFullItemData
	routesObject['load'+viewmodel.capital_name] = Controller.prototype.controller_load_model(options);
	routesObject['loadFull'+viewmodel.capital_name] = Controller.prototype.controller_load_model_with_population(options);
	routesObject['get'+viewmodel.page_plural_title+'Data'] = Controller.prototype.controller_model_search_query; //getItemsData
	routesObject['load'+viewmodel.page_plural_title+'WithDefaultLimit'] = Controller.prototype.controller_load_model_with_default_limit(options); //loadItemsWithDefaultLimit
	routesObject['load'+viewmodel.page_plural_title+'WithCount'] = Controller.prototype.controller_load_model_with_count(options); //loadItemsWithCount
	routesObject['load'+viewmodel.page_plural_title] = Controller.prototype.controller_model_query(options); //loadItems
	routesObject.controllerOptions = options;

	return routesObject;
};

Controller.prototype.controller_show = function(options){
	return function (req, res) {
		var viewtemplate, 
			viewdata, 
			model_name = options.model_name;

		options.model_view_name = 'show';
		viewtemplate = Controller.prototype.getViewTemplate(options);
		
		viewdata = {
			pagedata: {
				title: req.controllerData[model_name].title
			},
			user: req.user
		};
		viewdata[model_name] = req.controllerData[model_name];

		Controller.prototype.renderView(req, res, viewtemplate, viewdata);
	};
};

Controller.prototype.controller_index = function(options){
	return function (req, res) {
		var viewtemplate, 
			viewdata,
			viewmodel = Controller.prototype.getViewModelProperties(options);

		options.model_view_name = 'index';
		viewtemplate = Controller.prototype.getViewTemplate(options);
		
		viewdata = {
			pagedata: {
				title: viewmodel.page_plural_title
			},
			user: req.user
		};
		viewdata[viewmodel.name_plural] = req.controllerData[viewmodel.name_plural];
		viewdata[viewmodel.page_plural_count] = req.controllerData[viewmodel.page_plural_count];
		viewdata[viewmodel.page_pages] = Math.ceil(req.controllerData[viewmodel.page_plural_count] / req.query.limit);

		Controller.prototype.renderView(req, res, viewtemplate, viewdata);
	};
};

Controller.prototype.controller_create = function(options){
	return function (req, res) {
		var create_controller_model = CoreUtilities.removeEmptyObjectValues(req.body),
		appendid = (typeof req.appendid === 'boolean')? req.appendid : true,
		assetids=[];	
		create_controller_model.name = (create_controller_model.name) ? create_controller_model.name : CoreUtilities.makeNiceName(create_controller_model.title);
		create_controller_model[options.model_name+'authorname'] = req.user.username;
		create_controller_model.primaryauthor = req.user._id;
		create_controller_model.authors = [req.user._id];

		if (create_controller_model.date && create_controller_model.time) {
			create_controller_model.publishat = new Date(moment(create_controller_model.date + ' ' + create_controller_model.time).format());
		}

		if(req.controllerData && req.controllerData.assets && req.controllerData.assets.length >0){
			for(var x in req.controllerData.assets){
				assetids.push(req.controllerData.assets[x]._id);
			}
			create_controller_model.assets = assetids;
			create_controller_model.primaryasset = create_controller_model.assets[0];
		}

		create_controller_model = str2json.convert(create_controller_model);
		create_controller_model.changes= [{
			editor:req.user._id,
			editor_username:req.user.username,
			changeset:{
				title:create_controller_model.title,
				name:create_controller_model.name,
				content:create_controller_model.content,
				
				tags: (create_controller_model.tags && Array.isArray(create_controller_model.tags)) ? create_controller_model.tags: [create_controller_model.tags],
				categories: (create_controller_model.tags && Array.isArray(create_controller_model.categories)) ? create_controller_model.categories: [create_controller_model.categories],
				assets: (create_controller_model.tags && Array.isArray(create_controller_model.assets)) ? create_controller_model.assets: [create_controller_model.assets],
				contenttypes: (create_controller_model.tags && Array.isArray(create_controller_model.contenttypes)) ? create_controller_model.contenttypes: [create_controller_model.contenttypes],

				primaryasset:create_controller_model.primaryasset,
				contenttypeattributes:create_controller_model.contenttypeattributes,
			}
		}];
		Controller.prototype.createModel({
			model: periodicResources.mongoose.model(options.model_name.capitalizeFirstLetter()),
			newdoc: create_controller_model,
			res: res,
			req: req,
			successredirect: req.redirectpath ||  '/p-admin/content/'+options.model_name+'/',
			appendid: appendid
		});
	};
};

Controller.prototype.save_revision = function(req,res,next){
	req.saverevision = true;
	next();
};

Controller.prototype.controller_update = function (options) {
	return function(req, res){
		var update_controller_model = (req.skipemptyvaluecheck)? req.body: CoreUtilities.removeEmptyObjectValues(req.body),
			saverevision= (typeof req.saverevision ==='boolean')? req.saverevision : true,
			assetids=[];

		if(update_controller_model.title && !update_controller_model.name){
			update_controller_model.name = (update_controller_model.name) ? update_controller_model.name : CoreUtilities.makeNiceName(update_controller_model.title);
		}

		// console.log('before update_controller_model.assets ',update_controller_model.assets );
		// console.log('before update_controller_model.assets length ',update_controller_model.assets.length );
		// console.log('Array.isArray(update_controller_model.assets) ',Array.isArray(update_controller_model.assets) );
		if(req.controllerData && req.controllerData.assets && req.controllerData.assets.length >0){
			for(var x in req.controllerData.assets){
				assetids.push(req.controllerData.assets[x]._id);
			}
			// console.log('assetids',assetids);
			// if(update_controller_model.assets && update_controller_model.assets){

			// }
			if(update_controller_model.assets && update_controller_model.assets.length >0 && Array.isArray(update_controller_model.assets) ){
				update_controller_model.assets = update_controller_model.assets.concat(assetids);
			}
			else if(update_controller_model.assets){
				var tempassetarray = [update_controller_model.assets];
				update_controller_model.assets = tempassetarray.concat(assetids);
			}
			else{
				update_controller_model.assets = assetids;
			}
		}
		// console.log('after update_controller_model.assets ',update_controller_model.assets );

		if (!update_controller_model.primaryasset && update_controller_model.assets && update_controller_model.assets.length > 0) {
			update_controller_model.primaryasset = update_controller_model.assets[0];
		}
		if (update_controller_model.date && update_controller_model.time) {
			update_controller_model.publishat = new Date(moment(update_controller_model.date + ' ' + update_controller_model.time).format());
		}
		update_controller_model = str2json.convert(update_controller_model);

		Controller.prototype.updateModel({
			cached: req.headers.periodicCache !== 'no-periodic-cache',
			model: periodicResources.mongoose.model(options.model_name.capitalizeFirstLetter()),
			id: update_controller_model.docid,
			updatedoc: update_controller_model,
			forceupdate: req.forceupdate,
			saverevision: saverevision,
			originalrevision: req.controllerData[options.model_name],
			population: 'contenttypes authors',
			res: res,
			req: req,
			successredirect: req.redirectpath ||  '/p-admin/'+options.model_name+'/edit/',
			appendid: true
		});
	};
};

Controller.prototype.controller_remove = function(options) {
	var model_name = options.model_name,
		viewmodel = { 
			name : model_name, //item
			name_plural : pluralize(model_name) //items
		};

	return function (req, res) {
		var removedata = req.controllerData[viewmodel.name],
			User = mongoose.model('User');

		if (!User.hasPrivilege(req.user, 710)) {
			Controller.prototype.handleDocumentQueryErrorResponse({
				err: new Error('EXT-UAC710: You don\'t have access to modify content'),
				res: res,
				req: req
			});
		}
		else {
			Controller.prototype.deleteModel({
				cached: req.headers.periodicCache !== 'no-periodic-cache',
				model: periodicResources.mongoose.model(options.model_name.capitalizeFirstLetter()),
				deleteid: removedata._id,
				req: req,
				res: res,
				callback: function (err) {
					if (err) {
						Controller.prototype.handleDocumentQueryErrorResponse({
							err: err,
							res: res,
							req: req
						});
					}
					else {
						Controller.prototype.handleDocumentQueryRender({
							req: req,
							res: res,
							redirecturl: req.redirectpath || '/'+viewmodel.name_plural,
							responseData: {
								result: 'success',
								data: 'deleted'
							}
						});
					}
				}
			});
		}
	};
};

Controller.prototype.controller_load_model = function(options){
	return function (req, res, next) {
		var params = req.params,
			population = 'contenttypes primaryauthor authors',
			docid = params.id;

		req.controllerData = (req.controllerData) ? req.controllerData : {};

		Controller.prototype.loadModel({
			cached: req.headers.periodicCache !== 'no-periodic-cache',
			docid: docid,
			population: population,
			model: periodicResources.mongoose.model(options.model_name.capitalizeFirstLetter()),
			callback: function (err, doc) {
				if (err) {
					Controller.prototype.handleDocumentQueryErrorResponse({
						err: err,
						res: res,
						req: req
					});
				}
				else if (doc) {
					req.controllerData.item = doc;
					next();
				}
				else {
					Controller.prototype.handleDocumentQueryErrorResponse({
						err: new Error('invalid document request'),
						res: res,
						req: req
					});
				}
			}
		});
	};
};

Controller.prototype.controller_load_model_with_population = function (options) {
	return function(req, res, next){
		var params = req.params,
			docid = params.id;

		req.controllerData = (req.controllerData) ? req.controllerData : {};

		Controller.prototype.loadModel({
			cached: req.headers.periodicCache !== 'no-periodic-cache',
			docid: docid,
			model: mongoose.model(options.model_name.capitalizeFirstLetter()),
			population: 'tags collections contenttypes categories assets primaryasset authors primaryauthor',
			callback: function (err, doc) {
				Controller.prototype.controller_handle_full_model_data(req, res, err, doc, next, null,options);
			}
		});
	};
};

Controller.prototype.controller_handle_full_model_data = function (req, res, err, doc, next, callback,options) {
	if (err) {
		this.handleDocumentQueryErrorResponse({
			err: err,
			res: res,
			req: req
		});
	}
	else if (doc) {
		req.controllerData[options.model_name] = doc;
		if (callback) {
			callback(req, res);
		}
		else {
			next();
		}
	}
	else {
		this.handleDocumentQueryErrorResponse({
			err: new Error('invalid document request'),
			res: res,
			req: req
		});
	}
};

Controller.prototype.controller_model_search_query = function(options){
	var viewmodel = Controller.prototype.getViewModelProperties(options.controllerOptions),
		parallelTask = {},
 		req = options.req,
		res = options.res,
 		pagenum = req.query.pagenum - 1,
		next = options.next,
		query = options.query,
		sort = req.query.sort,
		callback = options.callback,
		limit = req.query.limit || req.query.itemsperpage,
		offset = req.query.offset || (pagenum*limit),
		population = options.population,
		orQuery = options.orQuery,
		andQuery = options.andQuery,
		searchRegEx = new RegExp(CoreUtilities.stripTags(req.query.search), 'gi'),
		parallelFilterTask = {},
		model_to_use = mongoose.model(viewmodel.name.capitalizeFirstLetter());

	req.controllerData = (req.controllerData) ? req.controllerData : {};

	if(req.query.ids){
		var queryIdArray=[];
		if(Array.isArray(req.query.ids)){
			queryIdArray = req.query.ids;
		}
		else if(typeof req.query.ids ==='string'){
			queryIdArray = req.query.ids.split(',');
		}
		orQuery.push({
			'_id': {$in:queryIdArray}
		});
	}
	else if (req.query.search !== undefined && req.query.search.length > 0) {
		orQuery.push({
			title: searchRegEx
		}, {
			'name': searchRegEx
		});
	}

	parallelFilterTask.contenttypes = function(cb){
		if(req.query.filter_contenttypes){
			var contenttypesArray = (typeof req.query.filter_contenttypes==='string') ? req.query.filter_contenttypes.split(',') : req.query.filter_contenttypes;
			Contenttypes.find({'name':{$in:contenttypesArray}},'_id', function( err, contenttypeids){
				cb(err, contenttypeids);
			});
		}
		else{
			cb(null,null);
		}
	};	
	parallelFilterTask.categories = function(cb){
		if(req.query.filter_categories){
			var categoriesArray = (typeof req.query.filter_categories==='string') ? req.query.filter_categories.split(',') : req.query.filter_categories;

			Category.find({'name':{$in:categoriesArray}},'_id', function( err, categoryids){
				cb(err, categoryids);
			});
		}
		else{
			cb(null,null);
		}
	};
	parallelFilterTask.tags = function(cb){
		if(req.query.filter_tags){
			var tagsArray = (typeof req.query.filter_tags==='string') ? req.query.filter_tags.split(',') : req.query.filter_tags;

			Tag.find({'name':{$in:tagsArray}},'_id', function( err, tagids){
				cb(err, tagids);
			});
		}
		else{
			cb(null,null);
		}
	};
	parallelFilterTask.authors = function(cb){
		if(req.query.filter_authors){
			var authorsArray = (typeof req.query.filter_authors==='string') ? req.query.filter_authors.split(',') : req.query.filter_authors;

			User.find({'username':{$in:authorsArray}},'_id', function( err, userids){
				cb(err, userids);
			});
		}
		else{
			cb(null,null);
		}
	};

	async.parallel(
		parallelFilterTask,
		function(err,filters){
			if(err){
				Controller.prototype.handleDocumentQueryErrorResponse({
					err: err,
					res: res,
					req: req
				});
			}
			else{
				// console.log('filters',filters);
				if(filters.contenttypes){
					var ctarray =[];
					for(var z in filters.contenttypes){
						ctarray.push(filters.contenttypes[z]._id);
					}
					// console.log('ctarray',ctarray);
					orQuery.push({'contenttypes':{$in:ctarray}});
				}
				if(filters.categories){
					var catarray =[];
					for(var y in filters.categories){
						catarray.push(filters.categories[y]._id);
					}
					// console.log('ctarray',ctarray);
					orQuery.push({'categories':{$in:catarray}});
				}
				if(filters.tags){
					var tarray =[];
					for(var x in filters.tags){
						tarray.push(filters.tags[x]._id);
					}
					// console.log('ctarray',ctarray);
					orQuery.push({'tags':{$in:tarray}});
				}
				if(filters.authors){
					var aarray =[];
					for(var w in filters.authors){
						aarray.push(filters.authors[w]._id);
					}
					// console.log('ctarray',ctarray);
					orQuery.push({'authors':{$in:aarray}});
				}
				if(andQuery){
					orQuery.push(andQuery);
				}

				if(orQuery.length>0){
					query = {
						$and: orQuery
					};
				}

				// console.log('req.headers',req.headers);
				parallelTask[viewmodel.page_plural_count] = function(cb){
					if(req.headers['load'+viewmodel.page_single_count]){ // loaditemcount
						
						model_to_use.count(query, function( err, count){
						// Item.count(query, function( err, count){
							cb(err, count);
						});
					}
					else{
						cb(null,null);
					}
				};
				parallelTask[viewmodel.page_plural_query] = function(cb){ // itemsquery
					Controller.prototype.searchModel({
						cached: req.headers.periodicCache !== 'no-periodic-cache',
						model: model_to_use,
						query: query,
						sort: sort,
						limit: limit,
						offset: offset,
						population: population,
						callback: function (err, documents) {
							cb(err,documents);
						}
					});
				};

				async.parallel(
					parallelTask,
					function(err,results){
						if(err){
							Controller.prototype.handleDocumentQueryErrorResponse({
								err: err,
								res: res,
								req: req
							});
						}
						else{
							// console.log('results[viewmodel.page_plural_count]',results[viewmodel.page_plural_count]);// name_plural
							// console.log('viewmodel',viewmodel);// name_plural
							req.controllerData[viewmodel.name_plural] = results[viewmodel.page_plural_query];
							req.controllerData[viewmodel.page_plural_count] = results[viewmodel.page_plural_count];
							if(callback){
								callback(req, res);
							}
							else{
								next();								
							}
						}
				});	
			}
	});
};

Controller.prototype.controller_model_query = function(options){
	return function (req, res, next) {
		var query = {},
			population = 'tags categories authors contenttypes assets primaryasset primaryauthor',
			orQuery = [];

		Controller.prototype.controller_model_search_query({
			req: req,
			res: res,
			next: next,
			population: population,
			query: query,
			orQuery: orQuery,
			andQuery: req.andQuery,
			controllerOptions: options
		});
	};
};

Controller.prototype.controller_load_model_with_default_limit = function(options){
	var viewmodel = Controller.prototype.getViewModelProperties(options);

	return function (req, res, next) {
		req.query.limit = req.query[viewmodel.name_plural+'perpage'] || req.query.docsperpage || req.query.limit || 15;
		req.query.pagenum = (req.query.pagenum && req.query.pagenum >0) ? req.query.pagenum : 1;
		next();
	};
};

Controller.prototype.controller_load_model_with_count = function(options){
	var viewmodel = Controller.prototype.getViewModelProperties(options);

	return function (req, res, next) {
		req.headers['load'+viewmodel.page_single_count] = true;
		next();
	};
};

module.exports = Controller;

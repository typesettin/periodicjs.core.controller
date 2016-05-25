/*
 * periodic
 * http://github.com/typesettin/periodic
 *
 * Copyright (c) 2014 Yaw Joseph Etse. All rights reserved.
 */

'use strict';

var fs = require('fs-extra'),
		path = require('path'),
		os = require('os'),
		async = require('async'),
		bcrypt = require('bcrypt'),
		str2json = require('string-to-json'),
		Utilities = require('periodicjs.core.utilities'),
		CoreMailer = require('periodicjs.core.mailer'),
		objectComparison = require('objectcompare'),
		str2json = require('string-to-json'),
		pluralize = require('pluralize'),
		moment = require('moment'),
		merge = require('utils-merge'),
		Bluebird = require('bluebird'),
		mongoId = require('valid-objectid'),
		appenvironment,
		CoreUtilities,
		Item,
		Category,
		Tag,
		User,
		Userrole,
		Contenttypes,
		useCache = function(){
			// console.log('useCache global.CoreCache.status',global.CoreCache.status);
			return (global.CoreCache && global.CoreCache.status ==='active');
		},
		useViewCache = function(){
			// console.log('useViewCache global.CoreCache.options.view_cache_status',global.CoreCache.options.view_cache_status);
			return (global.CoreCache && global.CoreCache.status ==='active' && global.CoreCache.options.view_cache_status ==='active');
		},
		useDataCache = function(){
			// console.log('useDataCache global.CoreCache.options.data_cache_status',global.CoreCache.options.data_cache_status);
			return (global.CoreCache && global.CoreCache.status ==='active' && global.CoreCache.options.data_cache_status ==='active');
		},
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
	appenvironment = appSettings.application.environment;
	Item = mongoose.model('Item');
	Contenttypes = mongoose.model('Contenttype');
	Category = mongoose.model('Category');
	Tag = mongoose.model('Tag');
	User = mongoose.model('User');
	Userrole = mongoose.model('Userrole');
	pluralize.addIrregularRule('data','datas');

	if(resources.app && resources.app.locals){
		applocals = resources.app.locals;
	}
	CoreUtilities = new Utilities(resources);
};

String.prototype.capitalizeFirstLetter = function() {
	return this.charAt(0).toUpperCase() + this.slice(1);
};

var jsonCheck = function (req) {
	return (req.query.format === 'json' || req.params.ext === 'json' || path.extname(req.originalUrl) === '.json' || req.is('json') || req.params.callback || req.is('application/json'));
};

var formatJsonResponse = function (data) {
	return {
		result: 'success',
		data: {
			doc: data
		}
	};
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
			themefileext = options.themefileext || options.viewfileext,
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

Controller.prototype.respondInKind = function (options, asyncCallback) {
	var req = options.req,
			res = options.res,
			err = options.err,
			responseData = options.responseData || {},
			callback = options.callback || asyncCallback;
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
		referer: req.headers.referer,
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

	if(path.extname(req.originalUrl)==='.html' || req.is('html') || req.is('text/html') ||  path.extname(req.originalUrl)==='.htm'){
		// console.log('responding because format is html');
		callback(req,res,responseData);
	}
	else if (jsonCheck(req)) {
		if (periodicResources.settings.sessions.enabled  && req.session) {
			responseData.flash_messages = req.flash();
		}
		if (req.query.callback) {
			res.jsonp(responseData);
		}
		else {
			res.send(responseData);
		}
	}
	else if (options.redirecturl) {
		res.redirect(options.redirecturl);
		// console.log('req.flash()',req.flash());
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
			},
			userobject={};
	if(req){
		errormeta.ipinfo = {
			'x-forwarded-for': req.headers['x-forwarded-for'],
			remoteAddress: req.connection.remoteAddress,
			referer: req.headers.referer,
			originalUrl: req.originalUrl,
			headerHost: req.headers.host,
			osHostname: os.hostname()
		};
		userobject = req.user || req.body;
	}
	if(userobject.email || userobject.username){
		errormeta.ipinfo.user = userobject.email || userobject.username;
	}
	logger.error(err.message,err.stack,errormeta);
};

Controller.prototype.logWarning = function(options){
	var err = options.err,
			req = options.req,
			errormeta = {
				err:err
			},
			userobject={};
	if(req){
		errormeta.ipinfo = {
			'x-forwarded-for': req.headers['x-forwarded-for'],
			remoteAddress: req.connection.remoteAddress,
			referer: req.headers.referer,
			originalUrl: req.originalUrl,
			headerHost: req.headers.host,
			osHostname: os.hostname()
		};
		userobject = req.user || req.body;
	}
	if(userobject.email || userobject.username){
		errormeta.ipinfo.user = userobject.email || userobject.username;
	}
	logger.warn(err.message,err.stack,errormeta);
};

/**
 * default response handler for express views, or will redirect to another request
 * @param  {object} options res,req,redirecturl,err,callback,responseData - this is what's sent to the rendered template view, also appends http request information like base url, query string parameters, etc
 * @return {object} response object render or callback
 */
Controller.prototype.handleDocumentQueryRender = function (options, asyncCallback) {

	var res = options.res,
			req = options.req,
			redirecturl = options.redirecturl,
			err = options.err,
			callback = options.callback || asyncCallback,
			renderview = options.renderView,
			responseData = options.responseData,
			cachetype,
			cachekey,
			cachedView,
			useCacheTest = (useViewCache() && req.headers.periodicCache!=='no-periodic-cache'),
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
							if(!responseData.flash_messages && periodicResources.settings.sessions.enabled  && req.session){
								responseData.flash_messages = req.flash();
							}
							res.render(renderview, responseData,function(err,renderedview){
								if(err){
									if (callback) {
										callback(err);
									}
									else{
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
											if (callback) {
												callback(null,renderedview);
											}
											else{
												res.send(renderedview);
											}
										}
									});
								}
								else if (callback) {
									callback(null,renderedview);
								}
								else{
									res.send(renderedview);
								}
							});
						}
					});
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
				logger.silly('cache hit',cachekey);
				res.set('X-Periodic-Cache','hit');
				res.send(cachedViewData);
			}
			else{
				logger.silly('cache miss',cachekey);
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
			loggerFunction = logger.error,
			callback = options.callback; //,
	// errorFlashMessage = (options.errorflash) ? options.errorflash : errormessage;

	if(typeof options.use_warning ==='boolean' && options.use_warning===true){
		loggerFunction = logger.warn;
	}
	else if(typeof options.use_warning ==='string'){
		loggerFunction = logger[options.use_warning];
	}

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
			var userobject={},
					userfieldtouse='';
			if(req){
				userobject = req.user || req.body;
			}
			if(userobject.email || userobject.username){
				userfieldtouse = userobject.email || userobject.username;
			}

			loggerFunction(errormessage,err,{
				ipinfo:{
					'x-forwarded-for': req.headers['x-forwarded-for'],
					originalUrl: req.originalUrl,
					remoteAddress: req.connection.remoteAddress,
					referer: req.headers.referer,
					headerHost: req.headers.host,
					osHostname: os.hostname(),
					user:userfieldtouse
				}
			});
		}
	}

	var responseErrorData = {
		'result': 'error',
		'data': {
			error: errormessage
		}
	};
	if (jsonCheck(req)) {
		if (periodicResources.settings.sessions.enabled  && req.session) {
			responseErrorData.flash_messages = req.flash();
		}
		if (req.query.callback) {
			res.jsonp(responseErrorData);
		}
		else {
			res.send(responseErrorData);
		}
	}
	else {
		if (options.errorflash !== false && periodicResources.settings.sessions.enabled  && req.session){

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

var clearModelDocCache = function(options,asynccallback){
	var cachetype,
			req = options.req,
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
				if(model.modelName &&( doc.id || doc.name)){
					global.CoreCache.DataCache.del({
						model_name: model.modelName.toLowerCase(),
						model_name_plural: pluralize(model.modelName.toLowerCase()),
						docid: doc.id,
						docname: doc.name,
					},function(err,status){logger.silly('viewCache Del',status)});
				}
			},
			deleteViewCache = function(options){
				// console.log('deleteViewCache options',options);
				var doccache = [`${model.modelName.toLowerCase()}/:id`], //options.doccache,
						doclistcache = [`${ pluralize(model.modelName.toLowerCase())}`], //options.doclistcache,
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
				if(req){
					deleteKeysArray.push(global.CoreCache.generateKeyFromRequestUrl(cachetype,req.originalUrl));
					deleteKeysArray.push(global.CoreCache.generateKeyFromRequestUrl(cachetype,req.originalUrl.split('?')[0])); //strip out query string parameters from URL
					let baseURL = req.originalUrl.split(options.docid)[0];
					if(baseURL){
						let cleanBaseURL = baseURL.replace(model.modelName.toLowerCase(),pluralize(model.modelName.toLowerCase()));
						//get listing page
						deleteKeysArray.push(global.CoreCache.generateKeyFromRequestUrl(cachetype,baseURL));
						deleteKeysArray.push(global.CoreCache.generateKeyFromRequestUrl(cachetype,cleanBaseURL));
					}
				}
				// console.log('model.modelName',model.modelName, 'docid',docid , 'docname',docname);
				if(model.modelName &&( docid || docname)){
					global.CoreCache.ViewCache.del({
						model_name: model.modelName.toLowerCase(),
						model_name_plural: pluralize(model.modelName.toLowerCase()),
						docid: docid,
						docname: docname,
					},function(err,status){logger.silly('viewCache Del',status)});
				}
			};
	cachetype = global.CoreCache.ViewCache.type;

	if(useDataCache() ){
		deleteDataCache();
	}
	if(useViewCache()){
		deleteViewCache({
			doccache : global.CoreCache.options[model.modelName.toLowerCase()+'_doc_cache'],
			doclistcache : global.CoreCache.options[model.modelName.toLowerCase()+'_list_cache'],
			docid : doc.id,
			docname : doc.name//,
			// reqdoc : req.controllerData[model.modelName.toLowerCase()]
		});
	}
	if(deleteKeysArray.length>0){
		for(var y in deleteKeysArray){
			asyncDeleteFunctions.push(deleteViewKeyFunction(deleteKeysArray[y]));
		}
		async.series(asyncDeleteFunctions,function(err){
			if(err){
				logger.error(err);
			}
			logger.silly('cleared cache for ',deleteKeysArray);
			if(asynccallback && typeof asynccallback ==='function'){
				asynccallback();
			}
		});
	}
};

/**
 * short hand mongoose load document query
 * @param  {object} options model,docid - id or name,callback,population -mongoose population, selection - mongoose selection
 * @return {Function} callback(err,document)
 */
Controller.prototype.loadModel = function (options, asyncCallback) {
	var model = options.model,
			docid = options.docid,
			docnamelookup = options.docnamelookup || 'name',
			sort = options.sort,
			callback = options.callback || asyncCallback,
			population = options.population,
			selection = options.selection,
			query,
			namequery = {},
			cached = (typeof options.cached === 'boolean' && options.cached===true) && true,
			useCacheTest = (useDataCache() && cached),
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
				// console.log('query',query);
				if (population) {
					model.findOne(query).sort(sort).select(selection).populate(population).exec(queryCallback);
				}
				else {
					model.findOne(query).sort(sort).select(selection).exec(queryCallback);
				}
			};
	namequery[docnamelookup] = docid;
	// console.log('loadModel cached',cached);

	if (mongoId.isValid(docid)) {
		query = {
			$or: [namequery, {
				_id: docid
			}]
		};
	}
	else if (options.searchusername) {
		query = {
			$or: [namequery, {
				username: docid
			}]
		};
	}
	else {
		query = namequery;
	}
	// console.log('options.cached',options.cached);
	// console.log('useCache',useCache);
	// console.log('useCacheTest',useCacheTest);
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
 * short hand mongoose find by id query promisified
 * @param  {object} options model, docid, sort, population, selection, searchusername
 * options callback is automatically set to handle fulfillment of the async mongoose query
 * @return {object} chainable instance of bluebird promise
 */
Controller.prototype.loadModelPromisified = function (options) {
	return new Bluebird(function (resolve, reject) {
		var fulfiller = function (err, data) {
			if (err) {
				reject(err);
			}
			else {
				resolve(data);
			}
		};
		options.callback = fulfiller;
		Controller.prototype.loadModel(options);
	});
};

/**
 * short hand mongoose search documents query
 * @param  {object} options model,query - mongoose query,callback,population -mongoose population, selection - mongoose selection , limit, offset
 * @return {Function} callback(err,documents)
 */
Controller.prototype.searchModel = function (options, asyncCallback) {
	var model = options.model,
			query = options.query,
			sort = options.sort,
			offset = options.offset,
			fields = options.fields,
			selection = options.selection,
			limit = options.limit,
			callback = options.callback || asyncCallback,
			population = options.population,
			cached = (typeof options.cached === 'boolean' && options.cached===true) && true,
			useCacheTest = (useDataCache() && cached),
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
					model.find(query, fields).sort(sort).select(selection).limit(limit).skip(offset).populate(population).exec(queryDocsCallback);
				}
				else {
					model.find(query, fields).sort(sort).select(selection).limit(limit).skip(offset).exec(queryDocsCallback);
				}
			};

	sort = (sort) ? sort : '-createdat';
	offset = (offset) ? offset : 0;
	limit = (limit) ? limit : 500;
	if(global.CoreCache){
		cachekey = global.CoreCache.generateKeyFromRequestUrl(cachetype,pluralize(model.modelName.toLowerCase())+'+'+JSON.stringify(query)+'+'+sort+'+'+offset+'+'+selection+'+'+limit+'+'+population);
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
 * short hand mongoose find query promisified
 * @param  {object} options model, query, sort, offset, selection, limit, population
 * options callback is automatically set to handle fulfillment of the async mongoose query
 * @return {object} chainable instance of bluebird promise
 */
Controller.prototype.searchModelPromisified = function (options) {
	return new Bluebird(function (resolve, reject) {
		var fulfiller = function (err, data) {
			if (err) {
				reject(err);
			}
			else {
				resolve(data);
			}
		};
		options.callback = fulfiller;
		Controller.prototype.searchModel(options);
	});
};

/**
 * short hand mongoose create document query
 * @param  {object} options model,newdoc - document to insert, req, res,callback, successredirect, appendid - append the id of newly created document on redirect
 * @return {object} responseData or redirected page
 */
Controller.prototype.createModel = function (options, asyncCallback) {
	var model = options.model,
			newdoc = options.newdoc,
			req = options.req,
			res = options.res,
			callback = options.callback || asyncCallback,
			successredirect = options.successredirect,
			appendid = options.appendid,
			responseData = {},
			cached = (typeof options.cached === 'boolean' && options.cached===true) && true,
			useCacheTest = ((useDataCache() || useViewCache()) && cached);
	// console.log('useCacheTest',useCacheTest);
	// console.log('useDataCache()',useDataCache());
	// console.log('useViewCache()',useViewCache());


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
				if (arguments.length >=2) {
					delete arguments['0'];
					callback(null, arguments['1']);
				}
				else{
					callback(null, saveddoc);
				}
			}
			else if (jsonCheck(req)) {
				if (periodicResources.settings.sessions.enabled  && req.session){
					req.flash('success', 'Saved');
				}
				Controller.prototype.respondInKind({
					req: req,
					res: res,
					responseData: formatJsonResponse(saveddoc)
				});
			}
			else if (appendid) {
				if(periodicResources.settings.sessions.enabled  && req.session){
					req.flash('success', 'Saved');
				}
				res.redirect(successredirect + saveddoc._id);
			}
			else {
				if(periodicResources.settings.sessions.enabled  && req.session){
					req.flash('success', 'Saved');
				}
				res.redirect(successredirect);
			}

			if(useCacheTest){
				// console.log('createModel clearModelDocCache');
				clearModelDocCache({model:model,doc:saveddoc});
			}
		}
	}.bind(this));
};

/**
 * short hand mongoose create query promisified
 * @param  {object} options model, newdoc, req, res
 * options callback is automatically set to handle fulfillment of the async mongoose query
 * @return {object} chainable instance of bluebird promise
 */
Controller.prototype.createModelPromisified = function (options) {
	return new Bluebird(function (resolve, reject) {
		options.callback = function (err, data) {
			if (err) {
				reject(err);
			}
			else {
				resolve(data);
			}
		};
		Controller.prototype.createModel(options);
	});
};

var getIdFromPopulatedObject = function(object){
	if(object && typeof object ==='object' && object._id){
		return object._id.toString();
	}
	else{
		return object;
	}
};

var depopulateArray = function(array){
	var depopulatedArray =[];
	for(var i=0; i<array.length;i++){
		if(typeof array[i] ==='object' && typeof array[i]._id==='undefined'){
			depopulatedArray[i] = Controller.prototype.depopulate(array[i]);
		}
		else{
			depopulatedArray[i] = getIdFromPopulatedObject(array[i]);
		}
	}
	return depopulatedArray;
};

var depopulate = function(object){
	var depopulatedObject = {};
	for(var prop in object){
		if(Array.isArray(object[prop])){
			depopulatedObject[prop] = depopulateArray(object[prop]);
		}
		else if(object[prop]!==null && typeof object[prop] ==='object' && typeof object[prop]._id==='undefined' && new Date(object[prop]).toString()==='Invalid Date'){
			depopulatedObject[prop] = depopulate(object[prop]);
		}
		else{
			depopulatedObject[prop] = getIdFromPopulatedObject(object[prop]);
		}
	}
	return depopulatedObject;
};

Controller.prototype.depopulate = depopulate;

var compareHasDifferentValues = function(originalValue,revisionValue){
	var checkrevdate = new Date(revisionValue).toString();
	var checkoridate = new Date(originalValue).toString();

	if(originalValue!==null && revisionValue!==null && typeof originalValue!=='undefined' && typeof revisionValue!=='undefined' && originalValue.toString()===revisionValue.toString()){
		// console.log('string vals are the same',originalValue,revisionValue);
		return false;
	}
	else if(checkrevdate!=='Invalid Date' && checkoridate!=='Invalid Date' && checkrevdate === checkoridate &&
			moment(revisionValue).isValid() &&
			moment(originalValue).isValid() &&
			moment(revisionValue).isSame(originalValue)){
		// console.log('dates are the same',checkoridate,checkrevdate);
		return false;
	}
	else if(originalValue === null && (revisionValue==='' || revisionValue===null || typeof revisionValue ==='undefined')){
		// console.log('originalValue empty vals are the same',originalValue,revisionValue);
		return false;
	}
	else if(revisionValue === null && (originalValue==='' || originalValue===null || typeof originalValue ==='undefined')){
		// console.log('revisionValue empty vals are the same',originalValue,revisionValue);
		return false;
	}
	else{
		return true;
	}
};

var returnObjectDifference = function (original, revision, skipDepopulate) {
	var changesetdata = {};
	if(original.toJSON && typeof original.toJSON==='function'){
		original = original.toJSON();
	}
	else if(original.toObject && typeof original.toObject==='function'){
		original = original.toObject();
	}
	if(revision.toJSON && typeof revision.toJSON==='function'){
		revision = revision.toJSON();
	}
	else if(revision.toObject && typeof revision.toObject==='function'){
		revision = revision.toObject();
	}

	if(original.changes){
		delete original.changes;
	}
	if(revision.changes){
		delete revision.changes;
	}
	if(typeof original.__v!=='undefined'){
		delete original.__v;
	}
	if(typeof revision.__v!=='undefined'){
		delete revision.__v;
	}
	if(original.createdat){
		delete original.createdat;
	}
	if(revision.createdat){
		delete revision.createdat;
	}
	if(original._id){
		delete original._id;
	}
	if(revision._id){
		delete revision._id;
	}
	if(original.random){
		delete original.random;
	}
	if(revision.random){
		delete revision.random;
	}
	if (!skipDepopulate) {
		revision = depopulate(revision);
		original = depopulate(original);
	}

	var compareresult = objectComparison(original,revision),
			differences={};
	// console.log('compareresult',compareresult);
	if(compareresult.equal===false){
		for(var props in compareresult.differences){
			// console.log('compareresult.differences props',props);
			if(compareHasDifferentValues(compareresult.differences[props].firstValue,compareresult.differences[props].secondValue)){
				differences[props] = compareresult.differences[props].firstValue;
			}
		}
	}
	// console.log('differences',differences);
	changesetdata = str2json.convert(differences);
	// console.log('revision',revision);
	// console.log('original',original);
	console.log('changesetdata',changesetdata);
	return changesetdata;
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
	// useCacheTest = (useCache() && global.CoreCache && cached && req.headers.periodicCache!=='no-periodic-cache');

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
			else if (jsonCheck(req)) {
				if(periodicResources.settings.sessions.enabled  && req.session){
					req.flash('success', 'Saved');
				}
				Controller.prototype.respondInKind({
					req: req,
					res: res,
					responseData: formatJsonResponse(numAffected)
				});
			}
			else {
				if(periodicResources.settings.sessions.enabled  && req.session){
					req.flash('success', 'Saved');
				}
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
Controller.prototype.updateModel = function (options, asyncCallback) {
	if (!options.id) {
		//Added to enforce mongo id
		throw new Error('Update is missing mongo id');
	}
	var model = options.model,
			id = options.id,
			updatedoc = options.updatedoc,
			req = options.req,
			res = options.res,
			callback = options.callback || asyncCallback,
			successredirect = options.successredirect,
			originalrevision = options.originalrevision,
			skipDepopulate = options.skipDepopulate,
			appendid = options.appendid,
			responseData = {},
			updateOperation,
			cached = (typeof options.cached === 'boolean' && options.cached===true) && true,
			useCacheTest = ((useDataCache() || useViewCache()) && global.CoreCache && cached && req.headers.periodicCache!=='no-periodic-cache');

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
		updatedoc.updatedat = new Date();
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
				else if (jsonCheck(req)) {
					if(periodicResources.settings.sessions.enabled  && req.session){
						req.flash('success', 'Saved');
					}
					Controller.prototype.respondInKind({
						req: req,
						res: res,
						responseData: numAffected
					});
				}
				else {
					if(periodicResources.settings.sessions.enabled  && req.session){
						req.flash('success', 'Saved');
					}
					res.redirect(successredirect);
				}

				if(useCacheTest){
					// console.log('updateModel clearModelDocCache');
					updatedoc.id = id;
					clearModelDocCache({model:model,doc:updatedoc,req:req});
				}
			}
		});
	}
	else if (options.returnUpdatedDocument) {
		var updateOperationCheck = updateOperation.$set || {};
		updateOperationCheck = updateOperationCheck._id || null;
		var documentCheck = updateOperation.$set || {};
		var _idExist = documentCheck._id || null;
		var docIdExist = documentCheck.docid || null;
		updateOperation.$set._id = (!_idExist && docIdExist) ? docIdExist : _idExist;

		model.findByIdAndUpdate(id, updateOperation, {new: true},function (err, saveddoc) {
			if (err && callback) {
				callback(err, null);
			}
			else if (err && !callback) {
				this.handleDocumentQueryErrorResponse({
					err: err,
					errorflash: err.message,
					res: res,
					req: req
				});
			}
			else {
				if (callback) {
					callback(null, saveddoc);
				}
				else if (jsonCheck(req)) {
					if(periodicResources.settings.sessions.enabled  && req.session){
						req.flash('success', 'Saved');
					}
					if (options.population) {
						model.populate(saveddoc, options.population, function (err, popdoc) {
							if (err) {
								responseData.data.docpopulationerror = err;
								responseData.data.status = 'couldnt populate';
								responseData.data.doc = popdoc;
								Controller.prototype.respondInKind({
									req: req,
									res: res,
									responseData: responseData
								});
							}
							else {
								Controller.prototype.respondInKind({
									req: req,
									res: res,
									responseData: formatJsonResponse(saveddoc)
								});
							}
						});
					}
					else {
						Controller.prototype.respondInKind({
							req: req,
							res: res,
							responseData: formatJsonResponse(saveddoc)
						});
					}
				}
				else if (appendid) {
					if(periodicResources.settings.sessions.enabled  && req.session){
						req.flash('success', 'Saved');
					}
					res.redirect(successredirect + saveddoc._id);
				}
				else {
					if(periodicResources.settings.sessions.enabled  && req.session){
						req.flash('success', 'Saved');
					}
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

					changesetdiff = returnObjectDifference(originalrevision, changesetdata, skipDepopulate);
					if (Object.keys(changesetdiff).length > 0) {
						model.findByIdAndUpdate(
								id, {
									$push: {
										'changes': {
											changeset: changesetdiff,
											editor: (req && req.user && req.user._id) ? req.user._id: 'invalid_user_id',
											editor_username: (req && req.user && req.user.username) ? req.user.username : 'invalid_user_username'
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
	else {
		// console.log('before tried to save', updateOperation);
		// console.log('options.saverevision ',options.saverevision );
		model.findByIdAndUpdate(id, updateOperation, function (err, saveddoc) {
			// console.log('tried to save', updateOperation,err, saveddoc);
			// console.log('saveddoc', saveddoc);
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
				else if (jsonCheck(req)) {
					if(periodicResources.settings.sessions.enabled  && req.session){
						req.flash('success', 'Saved');
					}
					if (options.population) {
						model.findOne({
							_id: saveddoc._id
						}).populate(options.population).exec(function (err, popdoc) {
							if (err) {
								responseData.data.docpopulationerror = err;
								responseData.data.status = 'couldnt populate';
								responseData.data.doc = popdoc;
								Controller.prototype.respondInKind({
									req: req,
									res: res,
									responseData: responseData
								});
							}
							else {
								Controller.prototype.respondInKind({
									req: req,
									res: res,
									responseData: formatJsonResponse(saveddoc)
								});
							}
						});
					}
					else {
						Controller.prototype.respondInKind({
							req: req,
							res: res,
							responseData: formatJsonResponse(saveddoc)
						});
					}
				}
				else if (appendid) {
					if(periodicResources.settings.sessions.enabled  && req.session){
						req.flash('success', 'Saved');
					}
					res.redirect(successredirect + saveddoc._id);
				}
				else {
					if(periodicResources.settings.sessions.enabled  && req.session){
						req.flash('success', 'Saved');
					}
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

					changesetdiff = returnObjectDifference(originalrevision, changesetdata, skipDepopulate);
					if (Object.keys(changesetdiff).length > 0) {
						model.findByIdAndUpdate(
								id, {
									$push: {
										'changes': {
											changeset: changesetdiff,
											editor: (req && req.user && req.user._id) ? req.user._id: 'invalid_user_id',
											editor_username: (req && req.user && req.user.username) ? req.user.username : 'invalid_user_username'
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
 * short hand mongoose update promisified
 * @param  {object} options model, id, updatedoc
 * options callback is automatically set to handle fulfillment of the async mongoose query
 * @return {object} chainable instance of bluebird promise
 */
Controller.prototype.updateModelPromisified = function (options) {
	return new Bluebird(function (resolve, reject) {
		options.callback = function (err, data) {
			if (err) {
				reject(err);
			}
			else {
				resolve(data);
			}
		};
		Controller.prototype.updateModel(options);
	});
};

/**
 * short hand mongoose delete document query
 * @param  {object} options model,deleteid - id to delete,callback
 * @return {Function} callback(err)
 */
Controller.prototype.deleteModel = function (options,asyncCallback) {
	var model = options.model,
			deleteid = options.deleteid,
			req = options.req,
	// res = options.res,
			callback = options.callback || asyncCallback,
			cached = (typeof options.cached === 'boolean' && options.cached===true) && true,
			useCacheTest = ((useDataCache() || useViewCache()) && cached && global.CoreCache);
	model.remove({
		_id: deleteid
	}, function(err,status){
		if(useCacheTest){
			// console.log('deleteModel clearModelDocCache');
			// updatedoc.id = id;
			clearModelDocCache({
				model:model,
				req: req,
				doc:{
					id:deleteid
				}
			},callback);
		}
		else{
			if(callback && typeof callback ==='function'){
				callback();
			}
		}
	});
};

/**
 * short hand mongoose remove promisified
 * @param  {object} options model, deleteid, cached
 * options callback is automatically set to handle fulfillment of the async mongoose query
 * @return {object} chainable instance of bluebird promise
 */
Controller.prototype.deleteModelPromisified = function (options) {
	return new Bluebird(function (resolve, reject) {
		options.callback = function (err, data) {
			if (err) {
				reject(err);
			}
			else {
				resolve(data);
			}
		};
		Controller.prototype.deleteModel(options);
	});
};

Controller.prototype.getViewTemplate = function(options){
	var viewtemplate,
			model_name = (options.use_plural_view_names) ? pluralize(options.model_name) : options.model_name;
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

Controller.prototype.getRoutes = function (options) {
	var router = options.router,
			model = options.model,
			middleware = options.middleware,
			override = options.override;
	router.get(`/${ model.name_plural }/new`, (override && override.create_index && Array.isArray(override.create_index)) ? override.create_index : middleware.new);
	router.get(`/${ model.name_plural }/edit`, (override && override.update_index && Array.isArray(override.update_index)) ? override.update_index : middleware.edit);
	router.route(`/${ model.name_plural }`)
	.get((override && override.get_index && Array.isArray(override.get_index)) ? override.get_index : [middleware[`load${ model.page_plural_title }WithCount`], middleware[`load${ model.page_plural_title }WithDefaultLimit`], middleware[`load${ model.page_plural_title }`], middleware.index])
	.post((override && override.create_item && Array.isArray(override.create_item)) ? override.create_item : [periodicResources.core.controller.save_revision, middleware.create]);
	router.route(`/${ model.name_plural }/:id`)
	.get((override && override.get_item && Array.isArray(override.get_item)) ? override.get_item : [middleware[`loadFull${ model.capital_name }`], middleware.show])
	.put((override && override.update_item && Array.isArray(override.update_item)) ? override.update_item : [periodicResources.core.controller.save_revision, middleware.update])
	.delete((override && override.delete_item && Array.isArray(override.delete_item)) ? override.delete_item : [middleware[`loadFull${ model.capital_name }`], middleware.remove]);
	return router;
};

Controller.prototype.controller_routes = function (options) {
	var useOverride = (options.override && typeof options.overrride === 'object');
	var viewmodel = Controller.prototype.getViewModelProperties(options),
			router = (periodicResources.express) ? periodicResources.express.Router() : false,
			routesObject = {
				new: (useOverride && typeof options.override.new === 'function') ? options.override.new : Controller.prototype.controller_new(options),
				show: (useOverride && typeof options.override.show === 'function') ? options.override.show : Controller.prototype.controller_show(options),
				edit: (useOverride && typeof options.override.edit === 'function') ? options.override.edit : Controller.prototype.controller_edit(options),
				index: (useOverride && typeof options.override.index === 'function') ? options.override.index : Controller.prototype.controller_index(options),
				remove: (useOverride && typeof options.override.remove === 'function') ? options.override.remove : Controller.prototype.controller_remove(options),
				searchResults: (useOverride && typeof options.override.searchResults === 'function') ? options.override.searchResults : Controller.prototype.controller_search_index(options)
			};
	if (options.use_taxonomy_controllers) {
		routesObject.create = Controller.prototype.controller_create_taxonomy(options);
		routesObject.update = Controller.prototype.controller_update_taxonomy(options);
		routesObject.loadChildren = (useOverride && typeof options.override.loadChildren === 'function') ? options.override.loadChildren : Controller.prototype.controller_load_model_children(options);
		routesObject.showChildren = (useOverride && typeof options.override.showChildren === 'function') ? options.override.showChildren : Controller.prototype.controller_show_model_children(options);
	}
	else {
		routesObject.create = Controller.prototype.controller_create(options);
		routesObject.update = Controller.prototype.controller_update(options);
	}
	routesObject.create = (useOverride && typeof options.override.create === 'function') ? options.override.create : routesObject.create;
	routesObject.update = (useOverride && typeof options.override.update === 'function') ? options.override.update : routesObject.update;
	if (options.use_full_data) {
		routesObject[`loadFull${ viewmodel.capital_name }Data`] = (useOverride && typeof options.override[`loadFull${ viewmodel.capital_name }Data`] === 'function') ? options.override[`loadFull${ viewmodel.capital_name }Data`] : Controller.prototype.controller_handle_full_model_data; //loadFullItemData
	}
	if (options.use_append_array_data) {
		routesObject.append = (useOverride && typeof options.override.append === 'function') ? options.override.append : Controller.prototype.controller_array_append(options); //loadFullItemData
	}
	if (options.use_remove_array_data) {
		routesObject.remove = (useOverride && typeof options.override.remove === 'function') ? options.override.remove : Controller.prototype.controller_array_remove(options); //loadFullItemData
	}
	routesObject.cli = Controller.prototype.controller_cli; //loadFullItemData
	routesObject[`load${ viewmodel.capital_name }`] = Controller.prototype.controller_load_model(options);
	routesObject[`loadFull${ viewmodel.capital_name }`] = Controller.prototype.controller_load_model_with_population(options);
	routesObject[`get${ viewmodel.page_plural_title }Data`] = Controller.prototype.controller_model_search_query; //getItemsData
	routesObject[`load${ viewmodel.page_plural_title }WithDefaultLimit`] = Controller.prototype.controller_load_model_with_default_limit(options); //loadItemsWithDefaultLimit
	routesObject[`load${ viewmodel.page_plural_title }WithCount`] = Controller.prototype.controller_load_model_with_count(options); //loadItemsWithCount
	routesObject[`load${ viewmodel.page_plural_title }`] = Controller.prototype.controller_model_query(options); //loadItems
	routesObject.controllerOptions = options;
	if (router) {
		routesObject.router = Controller.prototype.getRoutes({
			router: router,
			model: viewmodel,
			middleware: routesObject,
			override: options.override
		});
	}
	return routesObject;
};

Controller.prototype.controller_edit = function (options) {
	return function (req, res) {
		var viewtemplate,
				viewdata,
				model_name = options.model_name;

		options.model_view_name = 'edit';
		viewtemplate = Controller.prototype.getViewTemplate(options);

		viewdata = {
			pagedata: {
				title: req.controllerData[model_name].title
			},
			user: req.user
		};
		if(options.use_admin_menu){
			viewdata.pagedata.extensions = CoreUtilities.getAdminMenu();
		}
		viewdata[model_name] = req.controllerData[model_name];

		Controller.prototype.renderView(req, res, viewtemplate, viewdata);
	};
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
		if(options.use_admin_menu){
			viewdata.pagedata.extensions = CoreUtilities.getAdminMenu();
		}
		viewdata[model_name] = req.controllerData[model_name];

		Controller.prototype.renderView(req, res, viewtemplate, viewdata);
	};
};

Controller.prototype.controller_new = function(options){
	return function (req, res) {
		var viewtemplate,
				viewdata,
				model_name = options.model_name;

		options.model_view_name = 'new';
		viewtemplate = Controller.prototype.getViewTemplate(options);

		viewdata = {
			pagedata: {
				title: 'New '+model_name
			},
			user: req.user
		};
		if(options.use_admin_menu){
			viewdata.pagedata.extensions = CoreUtilities.getAdminMenu();
		}
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
		// console.log('viewtemplate',viewtemplate);
		viewdata = {
			pagedata: {
				title: viewmodel.page_plural_title
			},
			user: req.user
		};
		if(options.use_admin_menu){
			viewdata.pagedata.extensions = CoreUtilities.getAdminMenu();
		}
		viewdata[viewmodel.name_plural] = req.controllerData[viewmodel.name_plural];
		viewdata[viewmodel.page_plural_count] = req.controllerData[viewmodel.page_plural_count];
		viewdata[viewmodel.page_pages] = Math.ceil(req.controllerData[viewmodel.page_plural_count] / req.query.limit);

		Controller.prototype.renderView(req, res, viewtemplate, viewdata);
	};
};

Controller.prototype.controller_search_index = function(options){
	return function (req, res) {
		var viewtemplate,
				viewdata,
				viewmodel = Controller.prototype.getViewModelProperties(options);

		options.model_view_name = 'search_index';
		viewtemplate = Controller.prototype.getViewTemplate(options);

		viewdata = {
			pagedata: {
				title: viewmodel.page_plural_title+' search results'
			},
			user: CoreUtilities.removePrivateInfo(req.user)
		};

		if(options.use_admin_menu){
			viewdata.pagedata.extensions = CoreUtilities.getAdminMenu();
		}
		viewdata[viewmodel.name_plural] = req.controllerData[viewmodel.name_plural];
		viewdata[viewmodel.page_plural_count] = req.controllerData[viewmodel.page_plural_count];
		viewdata[viewmodel.page_pages] = Math.ceil(req.controllerData[viewmodel.page_plural_count] / req.query.limit);

		Controller.prototype.renderView(req, res, viewtemplate, viewdata);
	};
};

Controller.prototype.controller_create_taxonomy = function(options){
	return function (req, res) {
		var model_to_use = (options.controllerOptions && options.controllerOptions.model) ? options.controllerOptions.model : mongoose.model(options.model_name.capitalizeFirstLetter());
		if (req.controllerData[options.model_name]) {
			Controller.prototype.handleDocumentQueryRender({
				req: req,
				res: res,
				responseData: {
					result: 'success',
					data: {
						doc: req.controllerData[options.model_name]
					}
				}
			});
		}
		else {
			var newtaxonomy = CoreUtilities.removeEmptyObjectValues(req.body);
			newtaxonomy.name = CoreUtilities.makeNiceName(newtaxonomy.title);
			newtaxonomy.author = req.user._id;

			if(options.use_admin_menu){
				viewdata.pagedata.extensions = CoreUtilities.getAdminMenu();
			}
			Controller.prototype.createModel({
				cached: req.headers.periodicCache !== 'no-periodic-cache',
				model: model_to_use,
				newdoc: newtaxonomy,
				res: res,
				req: req,
				successredirect: req.redirectpath ||  '/p-admin/content/'+options.model_name+'/',
				appendid: true
			});
		}
	};
};

Controller.prototype.controller_create = function(options){
	return function (req, res) {
		var create_controller_model = CoreUtilities.removeEmptyObjectValues(req.body),
				appendid = (typeof req.appendid === 'boolean')? req.appendid : true,
				assetids=[],
				model_to_use = (options.controllerOptions && options.controllerOptions.model) ? options.controllerOptions.model : mongoose.model(options.model_name.capitalizeFirstLetter());
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
		if(options.model_name === 'user' || options.use_controller_update_for_user===true){
			req.controllerData = (req.controllerData) ? req.controllerData : {};
			var err = model_to_use.checkValidation(merge({
				newuser: create_controller_model /*,
				 checkpassword: true */
			},req.controllerData.checkuservalidation));

			if (err) {
				Controller.prototype.handleDocumentQueryErrorResponse({
					err: err,
					res: res,
					req: req
				});
			}
			else {

				model_to_use.createNewUserAccount(merge({
							newuser: create_controller_model,
							lognewuserin: false,
							req: req,
							send_new_user_email: req.controllerData.send_new_user_email,
							welcomeemaildata: {
								getEmailTemplateFunction: Controller.prototype.getPluginViewDefaultTemplate,
								emailviewname: 'email/user/welcome',
								themefileext: appSettings.templatefileextension,
								sendEmailFunction: CoreMailer.sendEmail,
								subject: appSettings.name + ' New User Registration',
								replyto: appSettings.adminnotificationemail,
								hostname: req.headers.host,
								appenvironment: appenvironment,
								appname: appSettings.name,
							}
						},req.controllerData.checkuservalidation),
						function (newusererr , newuser ) {
							if (newusererr) {
								Controller.prototype.handleDocumentQueryErrorResponse({
									err: newusererr,
									res: res,
									req: req
								});
							}
							else if (jsonCheck(req)) {
								if (periodicResources.settings.sessions.enabled  && req.session) {
									req.flash('success', 'Saved');
								}
								Controller.prototype.respondInKind({
									req: req,
									res: res,
									responseData: formatJsonResponse(newuser)
								});
							}
							else{
								if(periodicResources.settings.sessions.enabled  && req.session){
									req.flash('success', 'Saved');
								}
								res.redirect(req.redirectpath ||  '/p-admin/content/'+options.model_name+'/');
							}
						});
			}
		}
		else{
			Controller.prototype.createModel({
				cached: req.headers.periodicCache !== 'no-periodic-cache',
				model: model_to_use,
				newdoc: create_controller_model,
				res: res,
				req: req,
				successredirect: req.redirectpath ||  '/p-admin/content/'+options.model_name+'/',
				appendid: appendid
			});
		}
	};
};

Controller.prototype.save_revision = function(req,res,next){
	req.saverevision = true;
	next();
};

Controller.prototype.controller_array_append = function(options){
	return function (req, res) {
		var newitemtoadd = CoreUtilities.removeEmptyObjectValues(req.body),
				model_to_use = (options.controllerOptions && options.controllerOptions.model) ? options.controllerOptions.model : mongoose.model(options.model_name.capitalizeFirstLetter());
		delete newitemtoadd._csrf;
		var objectToModify = newitemtoadd; //{'items':newitemtoadd};

		logger.silly('objectToModify', objectToModify);
		Controller.prototype.updateModel({
			cached: req.headers.periodicCache !== 'no-periodic-cache',
			model: model_to_use,
			id: req.controllerData[options.model_name]._id,
			updatedoc: objectToModify,
			saverevision: true,
			res: res,
			req: req,
			appendArray: true,
			successredirect: req.redirectpath ||  '/p-admin/'+options.model_name+'/edit/',
			appendid: true
		});
	};
};

Controller.prototype.controller_array_remove = function(options){
	return function (req, res) {
		var removecollection = req.controllerData[options.model_name],
				User = mongoose.model('User'),
				viewmodel = Controller.prototype.getViewModelProperties(options),
				model_to_use = (options.controllerOptions && options.controllerOptions.model) ? options.controllerOptions.model : mongoose.model(options.model_name.capitalizeFirstLetter());

		if (!User.hasPrivilege(req.user, 710)) {
			Controller.prototype.handleDocumentQueryErrorResponse({
				err: new Error('EXT-UAC710: You don\'t have access to modify '+viewmodel.name_plural+' content'),
				res: res,
				req: req
			});
		}
		else {
			Controller.prototype.deleteModel({
				cached: req.headers.periodicCache !== 'no-periodic-cache',
				model: model_to_use,
				deleteid: removecollection._id,
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
							redirecturl: '/p-admin/'+viewmodel.name_plural,
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

Controller.prototype.controller_cli = function(options){
	return function (argv) {
		if (argv.search) {
			var model_to_use = (options.controllerOptions && options.controllerOptions.model) ? options.controllerOptions.model : mongoose.model(options.model_name.capitalizeFirstLetter()),
					Model_To_Search = model_to_use,
					query,
					offset = argv.offset,
					sort = argv.sort,
					limit = argv.limit,
					population = options.load_multiple_model_population,
					searchRegEx = new RegExp(CoreUtilities.stripTags(argv.search), 'gi');

			if (argv.search === undefined || argv.search.length < 1) {
				query = {};
			}
			else {
				query = {
					$or: [{
						title: searchRegEx
					}, {
						'name': searchRegEx
					}]
				};
			}

			Controller.prototype.searchModel({
				cached: false,
				model: Model_To_Search,
				query: query,
				sort: sort,
				limit: limit,
				offset: offset,
				population: population,
				callback: function (err, docs) {
					console.log('in model search cb');
					if (err) {
						console.log(err);
						process.exit(0);
					}
					else {
						console.log('got docs');
						console.info(docs);
						process.exit(0);
					}
				}
			});
		}
		else {
			logger.silly('invalid task');
			process.exit(0);
		}
	};
};

Controller.prototype.controller_update_taxonomy = function(options){
	return function (req, res) {
		var updatetaxonomy = CoreUtilities.removeEmptyObjectValues(req.body),
				saverevision= (typeof req.saverevision ==='boolean')? req.saverevision : true,
				model_to_use = (options.controllerOptions && options.controllerOptions.model) ? options.controllerOptions.model : mongoose.model(options.model_name.capitalizeFirstLetter());
		updatetaxonomy.name = CoreUtilities.makeNiceName(updatetaxonomy.title);

		if (updatetaxonomy.parent && updatetaxonomy.parent.length > 0 && updatetaxonomy.parent[0] === updatetaxonomy.docid) {
			updatetaxonomy.parent = [];
		}
		else if (updatetaxonomy.parent && updatetaxonomy.parent.length > 1) {
			var temtaxonomy = updatetaxonomy.parent[0];
			updatetaxonomy.parent = [];
			updatetaxonomy.parent.push(temtaxonomy);
		}

		Controller.prototype.updateModel({
			cached: req.headers.periodicCache !== 'no-periodic-cache',
			model: model_to_use,
			id: updatetaxonomy.docid,
			updatedoc: updatetaxonomy,
			saverevision: saverevision,
			originalrevision: req.controllerData[options.model_name],
			population: options.load_model_population,
			res: res,
			req: req,
			successredirect:  req.redirectpath ||  '/p-admin/content/'+options.model_name+'/',
			appendid: true
		});
	};
};

Controller.prototype.controller_update = function (options) {
	return function(req, res){
		var update_controller_model = (req.skipemptyvaluecheck)? req.body: CoreUtilities.removeEmptyObjectValues(req.body),
				err = false,
				saverevision= (typeof req.saverevision ==='boolean')? req.saverevision : true,
				assetids=[],
				model_to_use = (options.controllerOptions && options.controllerOptions.model) ? options.controllerOptions.model : mongoose.model(options.model_name.capitalizeFirstLetter());

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

		if (!update_controller_model.primaryasset && update_controller_model.assets && Array.isArray(update_controller_model.assets) && update_controller_model.assets.length > 0) {
			update_controller_model.primaryasset = update_controller_model.assets[0];
		}
		if (update_controller_model.date && update_controller_model.time) {
			update_controller_model.publishat = new Date(moment(update_controller_model.date + ' ' + update_controller_model.time).format());
		}



		update_controller_model = str2json.convert(update_controller_model);

		if(options.model_name === 'user' || options.use_controller_update_for_user===true){
			req.controllerData = (req.controllerData) ? req.controllerData : {};
			var user_controller_model_data = {
				newuser: update_controller_model
			};
			user_controller_model_data = merge({
						newuser: update_controller_model
					},
					req.controllerData.checkuservalidation);

			err = model_to_use.checkValidation(user_controller_model_data);

			if (update_controller_model.password && !req.skippassword) {
				var salt = bcrypt.genSaltSync(10),
						hash = bcrypt.hashSync(update_controller_model.password, salt);
				update_controller_model.password = hash;
			}

			if (err) {
				Controller.prototype.handleDocumentQueryErrorResponse({
					err: err,
					res: res,
					req: req
				});
			}
		}
		// console.log("typeof err ==='boolean'",typeof err ==='boolean');
		// console.log("err === false",err === false);
		// console.log("upsate err ", err );

		if(!err){
			Controller.prototype.updateModel({
				cached: req.headers.periodicCache !== 'no-periodic-cache',
				model: model_to_use,
				id: update_controller_model.docid,
				updatedoc: update_controller_model,
				forceupdate: req.forceupdate,
				returnUpdatedDocument: options.returnUpdatedDocument,
				saverevision: saverevision,
				originalrevision: req.controllerData[options.model_name],
				population: options.load_model_population,
				res: res,
				req: req,
				successredirect: req.redirectpath ||  '/p-admin/'+options.model_name+'/edit/',
				appendid: true
			});

		}
	};
};

Controller.prototype.controller_remove = function(options) {
	var model_name = options.model_name,
			viewmodel = {
				name : model_name, //item
				name_plural : pluralize(model_name) //items
			},
			model_to_use = (options.controllerOptions && options.controllerOptions.model) ? options.controllerOptions.model : mongoose.model(options.model_name.capitalizeFirstLetter());

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
				model: model_to_use,
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

Controller.prototype.controller_compilation_item_data = function(compilation_item_collection_options){
	var req = compilation_item_collection_options.req,
			res = compilation_item_collection_options.res,
			err = compilation_item_collection_options.err,
			doc = compilation_item_collection_options.doc,
			next = compilation_item_collection_options.next,
			controllerOptions = compilation_item_collection_options.controllerOptions,
			options = controllerOptions,
			callback = compilation_item_collection_options.callback,
			model_to_use = (options.controllerOptions && options.controllerOptions.model) ? options.controllerOptions.model : mongoose.model(options.model_name.capitalizeFirstLetter());

	if (err) {
		Controller.prototype.handleDocumentQueryErrorResponse({
			err: err,
			res: res,
			req: req
		});
	}
	else {
		async.parallel({
					populateItems:function(asyncCB){
						model_to_use.populate(doc,{
							path: 'content_entities.entity_item',
							model: 'Item',
							select: 'title name content dek createdat updatedat publishat status contenttypes contenttypeattributes tags categories assets primaryasset authors primaryauthor itemauthorname'
						},asyncCB);
					},
					populateCollections:function(asyncCB){
						model_to_use.populate(doc,{
							path: 'content_entities.entity_collection',
							model: 'Collection',
							select: 'title name content dek createdat updatedat publishat status contenttypes contenttypeattributes tags categories assets primaryasset authors primaryauthor '
						},asyncCB);
					}
				},
				function(loadCompilationDataError,loadCompilationDataResults){
					if (loadCompilationDataError) {
						Controller.prototype.handleDocumentQueryErrorResponse({
							err: err,
							res: res,
							req: req
						});
					}
					else{
						async.parallel({
							entity_item_tags: function (callback) {
								model_to_use.populate(loadCompilationDataResults.populateItems, {
											path: 'content_entities.entity_item.tags',
											model: 'Tag',
											select: 'title name content createdat updatedat publishat status contenttypes contenttypeattributes tags categories assets primaryasset authors primaryauthor itemauthorname'
										},
										callback);
							},
							entity_collection_tags: function (callback) {
								model_to_use.populate(loadCompilationDataResults.populateCollections, {
											path: 'content_entities.entity_collection.tags',
											model: 'Tag',
											select: 'title name content createdat updatedat publishat status contenttypes contenttypeattributes tags categories assets primaryasset authors primaryauthor itemauthorname'
										},
										callback);
							},
							entity_item_categories: function (callback) {
								model_to_use.populate(loadCompilationDataResults.populateItems, {
											path: 'content_entities.entity_item.categories',
											model: 'Category',
											select: 'title name content createdat updatedat publishat status contenttypes contenttypeattributes tags categories authors primaryauthor '
										},
										callback);
							},
							entity_collection_categories: function (callback) {
								model_to_use.populate(loadCompilationDataResults.populateCollections, {
											path: 'content_entities.entity_collection.categories',
											model: 'Category',
											select: 'title name content createdat updatedat publishat status contenttypes contenttypeattributes tags categories authors primaryauthor '
										},
										callback);
							},
							entity_item_authors: function (callback) {
								model_to_use.populate(loadCompilationDataResults.populateItems, {
											path: 'content_entities.entity_item.authors',
											model: 'User',
											// select: 'firstname name content createdat updatedat publishat status contenttypes contenttypeattributes tags categories assets primaryasset authors primaryauthor itemauthorname'
										},
										callback);
							},
							entity_item_primaryauthor: function (callback) {
								model_to_use.populate(loadCompilationDataResults.populateItems, {
											path: 'content_entities.entity_item.primaryauthor',
											model: 'User',
											// select: 'title name content createdat updatedat publishat status contenttypes contenttypeattributes tags categories assets primaryasset authors primaryauthor itemauthorname'
										},
										callback);
							},
							entity_item_contenttypes: function (callback) {
								model_to_use.populate(loadCompilationDataResults.populateItems, {
											path: 'content_entities.entity_item.contenttypes',
											model: 'Contenttype',
											// select: 'title name content createdat updatedat publishat status contenttypes contenttypeattributes tags categories assets primaryasset authors primaryauthor itemauthorname'
										},
										callback);
							},
							entity_item_assets: function (callback) {
								model_to_use.populate(loadCompilationDataResults.populateItems, {
											path: 'content_entities.entity_item.assets',
											model: 'Asset',
											// select: 'title name content createdat updatedat publishat status contenttypes contenttypeattributes tags categories assets primaryasset authors primaryauthor itemauthorname'
										},
										callback);
							},
							entity_item_primaryasset: function (callback) {
								model_to_use.populate(loadCompilationDataResults.populateItems, {
											path: 'content_entities.entity_item.primaryasset',
											model: 'Asset',
											// select: 'title name content createdat updatedat publishat status contenttypes contenttypeattributes tags categories assets primaryasset authors primaryauthor itemauthorname'
										},
										callback);
							},
							entity_collection_authors: function (callback) {
								model_to_use.populate(loadCompilationDataResults.populateCollections, {
											path: 'content_entities.entity_collection.authors',
											model: 'User',
											// select: 'firstname name content createdat updatedat publishat status contenttypes contenttypeattributes tags categories assets primaryasset authors primaryauthor itemauthorname'
										},
										callback);
							},
							entity_collection_primaryauthor: function (callback) {
								model_to_use.populate(loadCompilationDataResults.populateCollections, {
											path: 'content_entities.entity_collection.primaryauthor',
											model: 'User',
											// select: 'title name content createdat updatedat publishat status contenttypes contenttypeattributes tags categories assets primaryasset authors primaryauthor itemauthorname'
										},
										callback);
							},
							entity_collection_contenttypes: function (callback) {
								model_to_use.populate(loadCompilationDataResults.populateCollections, {
											path: 'content_entities.entity_collection.contenttypes',
											model: 'Contenttype',
											// select: 'title name content createdat updatedat publishat status contenttypes contenttypeattributes tags categories assets primaryasset authors primaryauthor itemauthorname'
										},
										callback);
							},
							entity_collection_assets: function (callback) {
								model_to_use.populate(loadCompilationDataResults.populateCollections, {
											path: 'content_entities.entity_collection.assets',
											model: 'Asset',
											// select: 'title name content createdat updatedat publishat status contenttypes contenttypeattributes tags categories assets primaryasset authors primaryauthor itemauthorname'
										},
										callback);
							},
							entity_collection_primaryasset: function (callback) {
								model_to_use.populate(loadCompilationDataResults.populateCollections, {
											path: 'content_entities.entity_collection.primaryasset',
											model: 'Asset',
											// select: 'title name content createdat updatedat publishat status contenttypes contenttypeattributes tags categories assets primaryasset authors primaryauthor itemauthorname'
										},
										callback);
							}
						}, function (err, results) {
							if (err) {
								Controller.prototype.handleDocumentQueryErrorResponse({
									err: err,
									res: res,
									req: req
								});
							}
							else if (loadCompilationDataResults.populateItems || loadCompilationDataResults.populateCollections) {
								// console.log('results.assets', results.assets);
								var mergedCompilationData;
								if(loadCompilationDataResults.populateItems){
									mergedCompilationData = merge(loadCompilationDataResults.populateItems, results.entity_item_tags);
									mergedCompilationData = merge(mergedCompilationData, results.entity_item_assets);
									mergedCompilationData = merge(mergedCompilationData, results.entity_item_primaryauthor);
								}
								if(loadCompilationDataResults.populateCollections){
									mergedCompilationData = merge(loadCompilationDataResults.populateCollections, results.entity_collection_tags);
									mergedCompilationData = merge(mergedCompilationData, results.entity_collection_assets);
									mergedCompilationData = merge(mergedCompilationData, results.entity_collection_primaryauthor);
								}
								req.controllerData.compilation = mergedCompilationData;
								// req.controllerData.compilationData = results;
								if (callback) {
									callback(req, res);
								}
								else {
									next();
								}
							}
							else {
								Controller.prototype.handleDocumentQueryErrorResponse({
									err: new Error('invalid compilation request'),
									res: res,
									req: req
								});
							}
							// console.log('results',results.tags.items[0].item);
						});
					}
				});
	}
};

Controller.prototype.controller_collection_item_data = function (collection_item_options) {
	var req = collection_item_options.req,
			res = collection_item_options.res,
			err = collection_item_options.err,
			doc = collection_item_options.doc,
			next = collection_item_options.next,
			controllerOptions = collection_item_options.controllerOptions,
			options = controllerOptions,
			callback = collection_item_options.callback,
			model_to_use = (options.controllerOptions && options.controllerOptions.model) ? options.controllerOptions.model : mongoose.model(options.model_name.capitalizeFirstLetter());

	if (err) {
		Controller.prototype.handleDocumentQueryErrorResponse({
			err: err,
			res: res,
			req: req
		});
	}
	else {
		model_to_use.populate(doc, {
			path: 'items.item',
			model: 'Item',
			select: 'title name content createdat updatedat publishat status contenttypes contenttypeattributes tags categories assets primaryasset authors primaryauthor itemauthorname'
		}, function (err, populatedcollection) {
			if (err) {
				Controller.prototype.handleDocumentQueryErrorResponse({
					err: err,
					res: res,
					req: req
				});
			}
			else {
				// console.log('doc',populatedcollection);
				async.parallel({
					tags: function (callback) {
						model_to_use.populate(populatedcollection, {
									path: 'items.item.tags',
									model: 'Tag',
									select: 'title name content createdat updatedat publishat status contenttypes contenttypeattributes tags categories assets primaryasset authors primaryauthor itemauthorname'
								},
								callback);
					},
					categories: function (callback) {
						model_to_use.populate(populatedcollection, {
									path: 'items.item.categories',
									model: 'Category',
									select: 'title name content createdat updatedat publishat status contenttypes contenttypeattributes tags categories authors primaryauthor '
								},
								callback);
					},
					authors: function (callback) {
						model_to_use.populate(populatedcollection, {
									path: 'items.item.authors',
									model: 'User',
									// select: 'firstname name content createdat updatedat publishat status contenttypes contenttypeattributes tags categories assets primaryasset authors primaryauthor itemauthorname'
								},
								callback);
					},
					primaryauthor: function (callback) {
						model_to_use.populate(populatedcollection, {
									path: 'items.item.primaryauthor',
									model: 'User',
									// select: 'title name content createdat updatedat publishat status contenttypes contenttypeattributes tags categories assets primaryasset authors primaryauthor itemauthorname'
								},
								callback);
					},
					contenttypes: function (callback) {
						model_to_use.populate(populatedcollection, {
									path: 'items.item.contenttypes',
									model: 'Contenttype',
									// select: 'title name content createdat updatedat publishat status contenttypes contenttypeattributes tags categories assets primaryasset authors primaryauthor itemauthorname'
								},
								callback);
					},
					assets: function (callback) {
						model_to_use.populate(populatedcollection, {
									path: 'items.item.assets',
									model: 'Asset',
									// select: 'title name content createdat updatedat publishat status contenttypes contenttypeattributes tags categories assets primaryasset authors primaryauthor itemauthorname'
								},
								callback);
					},
					primaryasset: function (callback) {
						model_to_use.populate(populatedcollection, {
									path: 'items.item.primaryasset',
									model: 'Asset',
									// select: 'title name content createdat updatedat publishat status contenttypes contenttypeattributes tags categories assets primaryasset authors primaryauthor itemauthorname'
								},
								callback);
					}
				}, function (err, results) {
					if (err) {
						Controller.prototype.handleDocumentQueryErrorResponse({
							err: err,
							res: res,
							req: req
						});
					}
					else if (populatedcollection) {
						// console.log('results.assets', results.assets);
						var mergedCollectionData = merge(populatedcollection, results.tags);
						mergedCollectionData = merge(mergedCollectionData, results.assets);
						mergedCollectionData = merge(mergedCollectionData, results.primaryauthor);
						req.controllerData.collection = mergedCollectionData;
						// req.controllerData.collectionData = results;
						if (callback) {
							callback(req, res);
						}
						else {
							next();
						}
					}
					else {
						Controller.prototype.handleDocumentQueryErrorResponse({
							err: new Error('invalid collection request'),
							res: res,
							req: req
						});
					}
					// console.log('results',results.tags.items[0].item);
				});
			}
		});
	}
};

Controller.prototype.controller_load_model = function(options){
	return function (req, res, next) {
		var params = req.params,
				population = options.load_model_population,
				docid = params.id,
				single_model_item_callback = function (callbackOptions) {
					var err = callbackOptions.err,
							doc = callbackOptions.doc;
					if (err) {
						Controller.prototype.handleDocumentQueryErrorResponse({
							err: err,
							res: res,
							req: req
						});
					}
					else if (doc || options.use_taxonomy_controllers) {
						req.controllerData[options.model_name] = doc;
						next();
					}
					else if(!doc && req.controllerData.skipIfInvalid){
						next();
					}
					else {
						Controller.prototype.handleDocumentQueryErrorResponse({
							err: new Error('invalid document request'),
							res: res,
							req: req
						});
					}
				},
				single_model_collection_callback = function(callbackOptions){
					Controller.prototype.controller_collection_item_data(callbackOptions);
				},
				single_model_compilation_callback = function(callbackOptions){
					Controller.prototype.controller_compilation_item_data(callbackOptions);
				},
				load_model_callback_function,
				model_to_use = (options.controllerOptions && options.controllerOptions.model) ? options.controllerOptions.model : mongoose.model(options.model_name.capitalizeFirstLetter());

		switch(options.model_name){
			case 'collection':
				load_model_callback_function = single_model_collection_callback;
				break;
			case 'compilation':
				load_model_callback_function = single_model_compilation_callback;
				break;
			default:
				load_model_callback_function = single_model_item_callback;
				break;
		}

		req.controllerData = (req.controllerData) ? req.controllerData : {};
		// console.log('req.headers.periodicCache',req.headers.periodicCache);
		Controller.prototype.loadModel({
			cached: req.headers.periodicCache !== 'no-periodic-cache',
			docid: docid,
			population: (req.controllerData && typeof req.controllerData.skip_population==='boolean' && req.controllerData.skip_population)? '' : population,
			docnamelookup: options.docnamelookup,
			model: model_to_use,
			callback: function (err, doc) {
				// req, res, err, doc, next, controllerOptions, callback
				load_model_callback_function({
					err: err,
					doc: doc,
					controllerOptions: options,
					req: req,
					res: res,
					next: next,
				});
			}
		});
	};
};

Controller.prototype.controller_load_model_children = function(options){
	return function (req, res, next) {
		var taxonomyitem = req.controllerData[options.model_name];
		taxonomyitem.getChildren(
				function (err, taxonomyitemwithchildren) {
					if (err) {
						Controller.prototype.handleDocumentQueryErrorResponse({
							err: err,
							res: res,
							req: req
						});
					}
					else {
						req.controllerData[options.model_name+'withchildren'] = taxonomyitemwithchildren;
						next();
					}
				});
	};
};

Controller.prototype.controller_show_model_children = function(options){
	return function (req, res) {
		var viewtemplate,
				viewdata,
				model_name = options.model_name;

		options.model_view_name = 'search_index';
		viewtemplate = Controller.prototype.getViewTemplate(options);

		viewdata = {
			pagedata: {
				title: req.controllerData[model_name].title+' search result'
			},
			user: CoreUtilities.removePrivateInfo(req.user),
			children: req.controllerData[options.model_name+'withchildren'],
		};

		Controller.prototype.renderView(req, res, viewtemplate, viewdata);
	};
};

Controller.prototype.controller_load_model_with_population = function (options) {
	return function(req, res, next){
		var params = req.params,
				docid = params.id,
				model_to_use = (options.controllerOptions && options.controllerOptions.model) ? options.controllerOptions.model : mongoose.model(options.model_name.capitalizeFirstLetter());

		req.controllerData = (req.controllerData) ? req.controllerData : {};
		// console.log('req.headers.periodicCache',req.headers.periodicCache);

		Controller.prototype.loadModel({
			cached: req.headers.periodicCache !== 'no-periodic-cache',
			docid: docid,
			docnamelookup: options.docnamelookup,
			model: model_to_use,
			population: (req.controllerData && typeof req.controllerData.skip_population==='boolean' && req.controllerData.skip_population===true)? '' : options.load_multiple_model_population,
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

var get_db_fq_op = function(options){
	switch(options.f_op){
		case 'size':
			return '$size';
		case 'lte':
		case 'lte-date':
			return '$lte';
		case 'lt':
		case 'lt-date':
			return '$lt';
		case 'gt':
		case 'gt-date':
			return '$gt';
		case 'gte':
		case 'gte-date':
			return '$gte';
		case 'not':
		case 'not-date':
			return '$ne';
		case 'not-in':
			return '$nin';
		case 'in':
			return '$in';
		case 'has':
		case 'exists':
			return '$exists';
		case 'all':
		case 'contains':
			return '$all';
		default:
			return null;
	}
};
var get_db_fq_val = function(options){
	switch(options.f_op){
		case 'is-date':
		case 'not-date':
		case 'lte-date':
		case 'lt-date':
		case 'gte-date':
		case 'gt-date':
		case 'is-date':
			return moment(options.f_val).toDate();//moment to date
		case 'exists':
			if(options.f_val==='true' || options.f_val===true){
				return true;
			}
			else{
				return false;
			}
			break;
		case 'in':
		case 'not-in':
		case 'nin':
		case 'all':
		case 'contains':
			return options.f_val.split(',');//moment to date
		default:
			if(options.f_val==='null' || options.f_val ===null){
				return null;
			}
			else{
				return options.f_val;
			}
	}
};

Controller.prototype.controller_model_search_query = function(options){
	var viewmodel = Controller.prototype.getViewModelProperties(options.controllerOptions),
			parallelTask = {},
			req = options.req,
			res = options.res;
	req.controllerData = req.controllerData || {};
	var querypagenum = parseInt(req.query.pagenum) || parseInt(req.body.pagenum) || 1,
			pagenum = querypagenum - 1,
			next = options.next,
			query = options.query,
			fields = (options.fields && typeof options.fields === 'object') ? options.fields : undefined,
			originalOrQuery = options.query,
			sort = req.query.sort || req.body.sort,
			callback = options.callback,
			limit = req.query.limit || req.body.limit || req.query.itemsperpage || req.body.itemsperpage || 1000,
			offset = req.query.offset || req.body.offset || (pagenum*limit),
			population = (req.query.skip_population || req.body.skip_population || req.controllerData.skip_population)?'':options.population,
			orQuery = options.orQuery || [],
			asyncCallback = options.asyncCallback,
			andQuery = options.andQuery,
			searchRegEx = (!req.body.allowSpecialCharacters && !req.controllerData.allowSpecialCharacters && !req.query.allowSpecialCharacters) ? new RegExp(CoreUtilities.stripTags(req.query.search || req.body.search), 'gi') : new RegExp(req.query.search || req.body.search, 'gi'),
			parallelFilterTask = {},
			searchNameField ={},
			customSearchFields = [],
			orbuilder,
	// cached = (typeof options.cached === 'boolean' && options.cached===true) && true,
	// useCacheTest = ((useDataCache()) && cached && global.CoreCache),
			orbuilderquery,
			model_to_use = (options.controllerOptions && options.controllerOptions.model) ? options.controllerOptions.model : mongoose.model(viewmodel.name.capitalizeFirstLetter());
	limit = parseInt(limit);
	offset = parseInt(offset);


	// console.log('req.query',req.query);

	var filterqueries = req.query.fq || req.body.fq;
	if(filterqueries){
		if(Array.isArray(filterqueries)===false){
			filterqueries = new Array(filterqueries);
		}
		filterqueries.forEach(function(f_query){
			orbuilder = f_query.split('|||');
			orbuilderquery ={};
			orbuilderquery[orbuilder[0]] = {};
			if(orbuilder[1]==='is'){
				orbuilderquery[orbuilder[0]] = orbuilder[2];
			}
			else if(orbuilder[1]==='is-date'){
				orbuilderquery[orbuilder[0]] = moment(orbuilder[2]).toDate();
			}
			else if(orbuilder[1]==='like'){
				orbuilderquery[orbuilder[0]] = new RegExp(CoreUtilities.stripTags( orbuilder[2]), 'gi');
			}
			else if(orbuilder[1]==='not-like'){
				orbuilderquery[orbuilder[0]] ={ '$not':new RegExp(CoreUtilities.stripTags( orbuilder[2]), 'gi')};
			}
			else{
				orbuilderquery[orbuilder[0]][get_db_fq_op({f_op:orbuilder[1]})] = get_db_fq_val({f_op:orbuilder[1],f_val:orbuilder[2]});
			}
			logger.debug('orbuilderquery',orbuilderquery);
			orQuery.push(orbuilderquery);
		});
	}

	if(req.query.ids || req.body.ids){
		var queryIdArray=[];
		if(Array.isArray(req.query.ids)){
			queryIdArray = req.query.ids;
		}
		else if(Array.isArray(req.body.ids)){
			queryIdArray = req.body.ids;
		}
		else if(typeof req.query.ids ==='string'){
			queryIdArray = req.query.ids.split(',');
		}
		else if(typeof req.body.ids ==='string'){
			queryIdArray = req.body.ids.split(',');
		}
		orQuery.push({
			'_id': {$in:queryIdArray}
		});
	}
	else if ((req.query.search !== undefined && req.query.search.length > 0) || (req.body.search !== undefined && req.body.search.length > 0)) {
		if(Array.isArray(options.controllerOptions.searchfields) && options.controllerOptions.searchfields){
			for(var sf=0; sf < options.controllerOptions.searchfields.length; sf++){
				searchNameField ={};
				searchNameField[options.controllerOptions.searchfields[sf]] = searchRegEx;
				customSearchFields.push(searchNameField);
			}
			orQuery.push({'$or':customSearchFields});
		}
		else{
			orQuery.push({
				title: searchRegEx
			}, {
				'name': searchRegEx
			});
		}
	}

	if(originalOrQuery){
		orQuery.push(originalOrQuery);
	}

	parallelFilterTask.contenttypes = function(cb){
		var contenttypesArray;
		if(req.query.filter_contenttypes){
			contenttypesArray = (typeof req.query.filter_contenttypes==='string') ? req.query.filter_contenttypes.split(',') : req.query.filter_contenttypes;
			Contenttypes.find({'name':{$in:contenttypesArray}},'_id', function( err, contenttypeids){
				cb(err, contenttypeids);
			});
		}
		else if(req.body.filter_contenttypes){
			contenttypesArray = (typeof req.body.filter_contenttypes==='string') ? req.body.filter_contenttypes.split(',') : req.body.filter_contenttypes;
			Contenttypes.find({'name':{$in:contenttypesArray}},'_id', function( err, contenttypeids){
				cb(err, contenttypeids);
			});
		}
		else{
			cb(null,null);
		}
	};
	parallelFilterTask.categories = function(cb){
		var categoriesArray;
		if(req.query.filter_categories){
			categoriesArray = (typeof req.query.filter_categories==='string') ? req.query.filter_categories.split(',') : req.query.filter_categories;

			Category.find({'name':{$in:categoriesArray}},'_id', function( err, categoryids){
				cb(err, categoryids);
			});
		}
		else if(req.body.filter_categories){
			categoriesArray = (typeof req.body.filter_categories==='string') ? req.body.filter_categories.split(',') : req.body.filter_categories;

			Category.find({'name':{$in:categoriesArray}},'_id', function( err, categoryids){
				cb(err, categoryids);
			});
		}
		else{
			cb(null,null);
		}
	};
	parallelFilterTask.tags = function(cb){
		var tagsArray ;
		if(req.query.filter_tags){
			tagsArray = (typeof req.query.filter_tags==='string') ? req.query.filter_tags.split(',') : req.query.filter_tags;

			Tag.find({'name':{$in:tagsArray}},'_id', function( err, tagids){
				cb(err, tagids);
			});
		}
		else if(req.body.filter_tags){
			tagsArray = (typeof req.body.filter_tags==='string') ? req.body.filter_tags.split(',') : req.body.filter_tags;

			Tag.find({'name':{$in:tagsArray}},'_id', function( err, tagids){
				cb(err, tagids);
			});
		}
		else{
			cb(null,null);
		}
	};
	parallelFilterTask.authors = function(cb){
		var authorsArray;
		if(req.query.filter_authors){
			authorsArray = (typeof req.query.filter_authors==='string') ? req.query.filter_authors.split(',') : req.query.filter_authors;

			User.find({'username':{$in:authorsArray}},'_id', function( err, userids){
				cb(err, userids);
			});
		}
		else if(req.body.filter_authors){
			authorsArray = (typeof req.body.filter_authors==='string') ? req.body.filter_authors.split(',') : req.body.filter_authors;

			User.find({'username':{$in:authorsArray}},'_id', function( err, userids){
				cb(err, userids);
			});
		}
		else{
			cb(null,null);
		}
	};
	parallelFilterTask.userroles = function(cb){
		var userrolesArray;
		if(req.query.filter_userroles){
			userrolesArray = (typeof req.query.filter_userroles==='string') ? req.query.filter_userroles.split(',') : req.query.filter_userroles;

			Userrole.find({'name':{$in:userrolesArray}},'_id', function( err, userids){
				cb(err, userids);
			});
		}
		else if(req.query.filter_userroles){
			userrolesArray = (typeof req.query.filter_userroles==='string') ? req.query.filter_userroles.split(',') : req.query.filter_userroles;

			Userrole.find({'name':{$in:userrolesArray}},'_id', function( err, userids){
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
					if(filters.userroles){
						var urarray =[];
						for(var q in filters.userroles){
							urarray.push(filters.userroles[q]._id);
						}
						orQuery.push({'userroles':{$in:urarray}});
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
							fields: fields,
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
									if(asyncCallback){
										asyncCallback(err);
									}
									else{
										Controller.prototype.handleDocumentQueryErrorResponse({
											err: err,
											res: res,
											req: req
										});
									}
								}
								else{
									// console.log('results[viewmodel.page_plural_count]',results[viewmodel.page_plural_count]);// name_plural
									// console.log('viewmodel',viewmodel);// name_plural
									var totalpages = Math.ceil(results[viewmodel.page_plural_count] / limit),
											prevpage = (querypagenum>1) ? querypagenum -1:1,
											nextpage = (querypagenum<totalpages) ? querypagenum +1:totalpages;

									req.controllerData[viewmodel.page_plural_count] = results[viewmodel.page_plural_count];
									req.controllerData[viewmodel.name+'limit'] = limit; //itempages
									req.controllerData[viewmodel.name+'offset'] = offset; //itempages
									req.controllerData[viewmodel.name+'pages'] = totalpages; //itempages
									req.controllerData[viewmodel.name+'page_current'] = querypagenum;
									req.controllerData[viewmodel.name+'page_next'] = nextpage;
									req.controllerData[viewmodel.name+'page_prev'] = prevpage;
									req.controllerData[viewmodel.name_plural] = results[viewmodel.page_plural_query];

									if(asyncCallback){
										asyncCallback(null,req.controllerData);
									}
									else if(callback){
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
		var query = (req.controllerData && req.controllerData.model_query)? req.controllerData.model_query : options.query || {},
				population = options.load_multiple_model_population,
				fields = (options.fields && typeof options.fields === 'object') ? options.fields : undefined,
				orQuery = [];

		fields = (req.controllerData && req.controllerData.model_fields)? req.controllerData.model_fields : fields;

		Controller.prototype.controller_model_search_query({
			req: req,
			res: res,
			next: next,
			population: population,
			fields: fields,
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
		req.query.limit = req.query[viewmodel.name_plural+'perpage'] || req.query.docsperpage || req.query.limit || req.body[viewmodel.name_plural+'perpage'] || req.body.docsperpage || req.body.limit || 15;
		req.query.pagenum = ((req.query.pagenum && req.query.pagenum >0) || (req.body.pagenum && req.body.pagenum >0)  ) ? req.query.pagenum || req.body.pagenum : 1;
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
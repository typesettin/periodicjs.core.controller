/*
 * periodic
 * http://github.com/typesettin/periodic
 *
 * Copyright (c) 2014 Yaw Joseph Etse. All rights reserved.
 */

'use strict';

var fs = require('fs-extra'),
	async = require('async'),
	semver = require('semver'),
	path = require('path');
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
var extensionFilePath = path.join(path.resolve(process.cwd(), './content/extensions/'), 'extensions.json');

var Extensions = function (appsettings) {
	var extensionsConfig = {},
		extensionsFiles = [];

	/** 
	 * gets the configuration information
	 * @return { string } file path for config file
	 */
	this.settings = function () {
		return extensionsConfig;
	};

	this.files = function () {
		return extensionsFiles;
	};

	this.savePluginConfig = function (name, value) {
		this[name] = value;
	}.bind(this);

	this.loadExtensions = function (obj) {
		extensionsFiles.forEach(function (file) {
			require(file)(obj);
		});
	};

	/** 
	 * loads app configuration
	 * @throws {Error} If missing config file
	 */
	this.init = function (appsettings) {
		// /** load pluginfile: content/plugin/extensions.json */

		if(typeof appsettings !=='undefined' && typeof appsettings.extensionFilePath !== 'undefined'){
			extensionFilePath = appsettings.extensionFilePath;
		}
		extensionsConfig = fs.readJSONSync(extensionFilePath);
		if(typeof appsettings.version !== 'undefined'){
			extensionsConfig.extensions.forEach(function (val) {
				try {
					if (semver.lte(val.periodicCompatibility, appsettings.version) && val.enabled) {
						extensionsFiles.push(this.getExtensionFilePath(val.name));
					}
				}
				catch (e) {
					console.error(e);
					throw new Error('Invalid Extension Configuration');
				}
			}.bind(this));
		}
	}.bind(this);

	this.init(appsettings);
};

Extensions.prototype.getExtensionConfFilePath = function(){
	return extensionFilePath;
};

Extensions.prototype.getExtensions = function(options,callback){
	fs.readJson(extensionFilePath,function(err,extJson){
		if(err){
			callback(err,null);
		}
		else{
			callback(null,extJson.extensions);
		}
	});
};

Extensions.prototype.getExtensionFilePath = function (extensionName) {
	return path.join(path.resolve(process.cwd(), './node_modules/', extensionName), 'index.js');
};

Extensions.prototype.getExtensionPeriodicConfFilePath = function (extensionName) {
	return path.join(path.resolve(process.cwd(), './node_modules/', extensionName), 'periodicjs.ext.json');
};

Extensions.prototype.getExtensionFilePath = function (extensionName) {
	return path.join(path.resolve(process.cwd(), './node_modules/', extensionName), 'index.js');
};

Extensions.prototype.getExtensionPackageJsonFilePath = function (extensionName) {
	return path.join(path.resolve(process.cwd(), './node_modules/', extensionName), 'package.json');
};

Extensions.prototype.getExtensionPeriodicConfFilePath = function (extensionName) {
	return path.join(path.resolve(process.cwd(), './node_modules/', extensionName), 'periodicjs.ext.json');
};

Extensions.prototype.installPublicDirectory = function (options,callback) {
	var extdir = options.extdir,
		extpublicdir = options.extpublicdir;
	// console.log("extname",extname);
	// fs.readdir(extdir, function (err, files) {
	fs.readdir(extdir, function (err) {
		// console.log("files",files);
		if (err) {
			callback(null,'No public files to copy');
		}
		else {
			//make destination dir
			fs.mkdirs(extpublicdir, function (err) {
				if (err) {
					callback(err,null);
				}
				else {
					fs.copy(extdir, extpublicdir, function (err) {
						if (err) {
							callback(err,null);
						}
						else {
							callback(null,'Copied public files');
						}
					});
				}
			});
		}
	});
};

Extensions.prototype.setExtConf = function (options,callback) {
	var logfile = options.logfile,
		// extname = options.extname,
		extpackfile = options.extpackfile,
		extconffile = options.extconffile,
		extpackfileJSON = {};

	this.getExtensions({},function(err,currentExtensionsConf){
		async.parallel({
			packfile: function (callback) {
				fs.readJson(extpackfile, callback);
				// Extensions.readJSONFileAsync(extpackfile, callback);
			},
			conffile: function (callback) {
				fs.readJson(extconffile, callback);
				// Extensions.readJSONFileAsync(extconffile, callback);
			}
		}, function (err, results) {
			if (err) {
				callback(err,null);
			}
			else {
				extpackfileJSON = {
					'name': results.packfile.name,
					'version': results.packfile.version,
					'periodicCompatibility': results.conffile.periodicCompatibility,
					'installed': true,
					'enabled': false,
					'date': new Date(),
					'periodicConfig': results.conffile
				};

				callback(null,{
					currentExtensions: currentExtensionsConf,
					extToAdd: extpackfileJSON,
					logfile: logfile,
					cli: options.cli
				});
			}
		});
	});
};

Extensions.prototype.updateExtConfFile = function (options,callback) {
	var currentExtConfSettings = {},
		currentExtensions = options.currentExtensions,
		extToAdd = options.extToAdd;
	currentExtConfSettings.extensions = [];
	// console.log('------------','extension to add',extToAdd);

	if (!extToAdd.name) {
		callback('extension conf doesn\'t have a valid name',null);
	}
	else if (!semver.valid(extToAdd.version)) {
		callback('extension conf doesn\'t have a valid semver',null);
	}
	else if (!semver.valid(extToAdd.periodicConfig.periodicCompatibility)) {
		callback('extension conf doesn\'t have a valid periodic semver',null);
	}
	else {
		var alreadyInConf = false,
			extIndex;
		for (var x in currentExtensions) {
			if (currentExtensions[x].name === extToAdd.name) {
				alreadyInConf = true;
				extIndex = x;
			}
		}
		if (alreadyInConf) {
			currentExtensions[x] = extToAdd;
		}
		else {
			currentExtensions.push(extToAdd);
		}
		currentExtConfSettings.extensions = currentExtensions;

		fs.outputJson(this.getExtensionConfFilePath(), currentExtConfSettings, function (err) {
			if (err) {
				callback(err,null);
			}
			else {
				callback(null,{
					message: extToAdd.name + ' installed, extensions.conf updated \r\n  ====##END##====',
					updatedExtensions: currentExtConfSettings.extensions
				});
			}
		});
	}
};

Extensions.prototype.getCurrentExt = function (options) {
	var extname = options.extname,
		currentExtensions = options.currentextconf.extensions,
		z = false,
		selectedExt;

	for (var x in currentExtensions) {
		if (currentExtensions[x].name === extname) {
			z = x;
		}
	}

	if (z !== false) {
		selectedExt = currentExtensions[z];
	}
	else{
		throw new Error('selected ext('+extname+') is not in the current configuration');
	}

	return {
		selectedExt: selectedExt,
		numX: z
	};
};

Extensions.prototype.removePublicFiles = function(options,callback){
	var publicDir = options.publicdir;
	fs.remove(publicDir, function (err) {
		if (err) {
			callback(err, null);
		}
		else {
			callback(null,'removed public directory');
		}
	});
};

Extensions.prototype.removeExtFromConf = function (options,callback) {
	var extname = options.extname,
		currentExtensionsConf = options.currentExtensionsConfJson,
		selectedExtObj = this.getCurrentExt({
			extname: extname,
			currentextconf: currentExtensionsConf
		}),
		numX = selectedExtObj.numX;

	currentExtensionsConf.extensions.splice(numX, 1);
	fs.outputJson(
		this.getExtensionConfFilePath(),
		currentExtensionsConf,
		function (err) {
			if (err) {
				callback(err, null);
			}
			else {
				callback(null,{
					message: extname + ' removed, extensions.conf updated, application restarting \r\n  ====##REMOVED-END##===='
				});
			}
		}
	);
};

Extensions.prototype.enableExtension = function (options, callback) {
	var selectedExtObj = {
			selectedExt: options.extension,
			numX: options.extensionx
		},
		selectedExt = selectedExtObj.selectedExt,
		numX = selectedExtObj.numX,
		selectedExtDeps = selectedExt.periodicConfig.periodicDependencies,
		numSelectedExtDeps = selectedExtDeps.length,
		confirmedDeps = [],
		appSettings=options.appSettings;

	selectedExt.enabled = true;
	appSettings.extconf.extensions = options.extensions;

	try {
		if (!semver.lte(
			selectedExt.periodicCompatibility, appSettings.version)) {
			callback(new Error('This extension requires periodic version: ' + selectedExt.periodicCompatibility + ' not: ' + appSettings.version),null);
		}
		else {
			for (var x in selectedExtDeps) {
				var checkDep = selectedExtDeps[x];
				for (var y in appSettings.extconf.extensions) {
					var checkExt = appSettings.extconf.extensions[y];
					if (checkDep.extname === checkExt.name && checkExt.enabled) {
						confirmedDeps.push(checkExt.name);
					}
				}
			}
			if (numSelectedExtDeps === confirmedDeps.length) {
				appSettings.extconf.extensions[numX].enabled = true;

				fs.outputJson(
					this.getExtensionConfFilePath(),
					appSettings.extconf,
					function (err) {
						if (err) {
							callback(err,null);
						}
						else {
							callback(null,'extension enabled');
						}
					}
				);
			}
			else {
				callback(new Error('Missing ' + (numSelectedExtDeps - confirmedDeps.length) + ' enabled extensions.'),null);
			}
		}
	}
	catch (e) {
		callback(e,null);
	}
};

Extensions.prototype.disableExtension = function (options, callback) {
	var selectedExtObj = {
			selectedExt: options.extension,
			numX: options.extensionx
		},
		// selectedExt = selectedExtObj.selectedExt,
		numX = selectedExtObj.numX,
		appSettings=options.appSettings;

	appSettings.extconf.extensions[numX].enabled = false;

	try {
		fs.outputJson(
			this.getExtensionConfFilePath(),
			appSettings.extconf,
			function (err) {
				if (err) {
					callback(err,null);
				}
				else {
					callback(null,'extension disabled');
				}
			}
		);
	}
	catch (e) {
		callback(e,null);
	}
};

module.exports = Extensions;
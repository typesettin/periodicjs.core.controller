'use strict';
const xss = require('xss');
const Promisie = require('promisie');
const fs = Promisie.promisifyAll(require('fs-extra'));
const path = require('path');
const os = require('os');
const bcrypt = require('bcrypt');
const str2json = require('string-to-json');
const Utilities = require('periodicjs.core.utilities');
const CoreMailer = require('periodicjs.core.mailer');
const objectComparison = require('objectcompare');
const pluralize = require('pluralize');
const moment = require('moment');
const merge = require('utils-merge');
const mongoId = require('valid-objectid');

var periodicResources;
var logger;
var appSettings;
var theme;
var controllerOptions;
var appenvironment;
var applocals;
var CoreUtilities;

const CORE = class Core {
	constructor (options = {}) {
		periodicResources = options;
		logger = options.logger;
		appSettings = options.settings;
		theme = options.settings.theme;
		controllerOptions = options;
		appenvironment = appSettings.application.environment;
		pluralize.addIrregularRule('data', 'datas');
		if (options.app && options.app.locals) { applocals = options.app.locals; }
		CoreUtilities = new Utilities(options);
	}
	respond (options) {
		let periodic = {
			version: appSettings.version,
			name: appSettings.name
		};
		let response = {};
		if (options.err || options.data instanceof Error) {
			response.status = 'error';
			response.result = 'error';
			response.data = Object.assign({}, { periodic, error: (options.data instanceof Error) ? options.data : options.err });
		}
		else {
			response.status = 'success';
			response.result = 'success';
			response.data = Object.assign({}, { periodic }, options.data);
		}
		return response;
	}
	logError (options) {

	}
	logWarning (options) {

	}
	load (options, cb) {

	}
	search (options, cb) {

	}
	create (options, cb) {

	}
	update (options, cb) {

	}
	delete (options, cb) {

	}
};

module.exports = CORE;
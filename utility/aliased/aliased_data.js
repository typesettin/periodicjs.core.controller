'use strict';
const path = require('path');
const wrapWithDeprecationWarning = require(path.join(__dirname, '../deprecate'));

var _loadModel = function () {
	let fn = function (options = {}, cb) {
		return this.db.default.load(options, cb);
	}
	let message = 'CoreController.loadModel: Use CoreController.db.default.load, CoreController.db[model_name].load, CoreController.meta.load or CoreController.meta.load[model_name] instead';
	return wrapWithDeprecationWarning.call(this, fn, message);
};

var _searchModel = function () {
	let fn = function (options = {}, cb) {
		return this.db.default.search(options, cb);
	}
	let message = 'CoreController.searchModel: Use CoreController.db.default.search, CoreController.db[model_name].search, CoreController.meta.search or CoreController.meta.search[model_name] instead';
	return wrapWithDeprecationWarning.call(this, fn, message);
};

var _createModel = function () {
	let fn = function (options = {}, cb) {
		return this.db.default.create(options, cb);
	}
	let message = 'CoreController.createModel: Use CoreController.db.default.create, CoreController.db[model_name].create, CoreController.meta.create or CoreController.meta.create[model_name] instead';
	return wrapWithDeprecationWarning.call(this, fn, message);
};

var _updateModel = function () {
	let fn = function (options = {}, cb) {
		return this.db.default.update(options, cb);
	}
	let message = 'CoreController.updateModel: Use CoreController.db.default.update, CoreController.db[model_name].update, CoreController.meta.update or CoreController.meta.update[model_name] instead';
	return wrapWithDeprecationWarning.call(this, fn, message);
};

var _deleteModel = function () {
	let fn = function (options = {}, cb) {
		return this.db.default.delete(options, cb);
	}
	let message = 'CoreController.deleteModel: Use CoreController.db.default.delete, CoreController.db[model_name].delete, CoreController.meta.delete or CoreController.meta.delete[model_name] instead';
	return wrapWithDeprecationWarning.call(this, fn, message);
};

module.exports = {
	loadModel: _loadModel,
	searchModel: _searchModel,
	createModel: _createModel,
	updateModel: _updateModel,
	deleteModel: _deleteModel
};
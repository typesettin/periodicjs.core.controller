'use strict';
const path = require('path');
const wrapWithDeprecationWarning = require(path.join(__dirname, '../deprecate'));

/**
 * Creates a function that takes configurable options and queries the database for a single document. Alias for CoreController.db.default.load or CoreController.meta.load
 * @return {Fuction} A function that queries the database for a single document
 */
var _loadModel = function () {
	/**
	 * Loads a single document from the database
	 * @param  {Object}   options Configurable options for load (see periodicjs.core.data for more details)
	 * @param  {Function} cb      Callback function
	 * @return {Object}         Returns a Promise which resolves with document if cb arugment is not passed
	 */
	let fn = function loadModel (options = {}, cb) {
		return this.db.default.load(options, cb);
	}
	let message = 'CoreController.loadModel: Use CoreController.db.default.load, CoreController.db[model_name].load, CoreController.meta.load or CoreController.meta.load[model_name] instead';
	return wrapWithDeprecationWarning.call(this, fn, message);
};

/**
 * Creates a function that takes configurable options and queries the database for multiple documents. Alias for CoreController.db.default.search or CoreController.meta.search
 * @return {Fuction} A function that queries the database for multiple documents
 */
var _searchModel = function () {
	/**
	 * Queries the database for multiple documents
	 * @param  {Object}   options Configurable options for search (see periodicjs.core.data for more details)
	 * @param  {Function} cb      Callback function
	 * @return {Object}         Returns a Promise which resolves with documents if cb arugment is not passed
	 */
	let fn = function searchModel (options = {}, cb) {
		return this.db.default.search(options, cb);
	}
	let message = 'CoreController.searchModel: Use CoreController.db.default.search, CoreController.db[model_name].search, CoreController.meta.search or CoreController.meta.search[model_name] instead';
	return wrapWithDeprecationWarning.call(this, fn, message);
};

/**
 * Creates a function that takes configurable options and creates a document. Alias for CoreController.db.default.create or CoreController.meta.create
 * @return {Fuction} A function that creates a document
 */
var _createModel = function () {
	/**
	 * Creates a document in the database
	 * @param  {Object}   options Configurable options for create (see periodicjs.core.data for more details)
	 * @param  {Function} cb      Callback function
	 * @return {Object}         Returns a Promise which resolves with created document if cb arugment is not passed
	 */
	let fn = function createModel (options = {}, cb) {
		return this.db.default.create(options, cb);
	}
	let message = 'CoreController.createModel: Use CoreController.db.default.create, CoreController.db[model_name].create, CoreController.meta.create or CoreController.meta.create[model_name] instead';
	return wrapWithDeprecationWarning.call(this, fn, message);
};

/**
 * Creates a function that takes configurable options and updates a document. Alias for CoreController.db.default.update or CoreController.meta.update
 * @return {Fuction} A function that updates a document
 */
var _updateModel = function () {
	/**
	 * Updates a document in the database
	 * @param  {Object}   options Configurable options for update (see periodicjs.core.data for more details)
	 * @param  {Function} cb      Callback function
	 * @return {Object}         Returns a Promise which resolves with the update status if cb argument is not passed
	 */
	let fn = function updateModel (options = {}, cb) {
		return this.db.default.update(options, cb);
	}
	let message = 'CoreController.updateModel: Use CoreController.db.default.update, CoreController.db[model_name].update, CoreController.meta.update or CoreController.meta.update[model_name] instead';
	return wrapWithDeprecationWarning.call(this, fn, message);
};

/**
 * Creates a function that takes configurable options and deletes a document. Alias for CoreController.db.default.delete or CoreController.meta.delete
 * @return {Fuction} A function that deletes a document
 */
var _deleteModel = function () {
	/**
	 * Deletes a document in the database
	 * @param  {Object}   options Configurable options for delete (see periodicjs.core.data for more details)
	 * @param  {Function} cb      Callback function
	 * @return {Object}         Returns a Promise which resolves with the delete status if cb argument is not passed
	 */
	let fn = function deleteModel (options = {}, cb) {
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
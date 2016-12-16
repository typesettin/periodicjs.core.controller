'use strict';
const path = require('path');
const wrapWithDeprecationWarning = require(path.join(__dirname, '../deprecate'));

var _controller_edit = function () {
	let fn = function controller_edit (options = {}) {
		return this.protocol.api.initialize.EDIT(options);
	};
	let message = 'CoreController.controller_edit: Use CoreController.protocol.api.initialize.EDIT, CoreController.meta.initialize.EDIT or CoreController.meta.initialize_edit instead';
	return wrapWithDeprecationWarning.call(this, fn, message);
};

var _controller_show = function (options = {}) {
	let fn = function controller_show (options = {}) {
		return this.protocol.api.initialize.SHOW(options);
	};
	let message = 'CoreController.controller_show: Use CoreController.protocol.api.initialize.SHOW, CoreController.meta.initialize.SHOW or CoreController.meta.initialize_show instead';
	return wrapWithDeprecationWarning.call(this, fn, message);
};

var _controller_new = function (options = {}) {
	let fn = function controller_new (options = {}) {
		return this.protocol.api.initialize.NEW(options);
	};
	let message = 'CoreController.controller_new: Use CoreController.protocol.api.initialize.NEW, CoreController.meta.initialize.NEW or CoreController.meta.initialize_new instead';
	return wrapWithDeprecationWarning.call(this, fn, message);
};

var _controller_index = function (options = {}) {
	let fn = function controller_index (options = {}) {
		return this.protocol.api.initialize.INDEX(options);
	};
	let message = 'CoreController.controller_index: Use CoreController.protocol.api.initialize.INDEX, CoreController.meta.initialize.INDEX or CoreController.meta.initialize_index instead';
	return wrapWithDeprecationWarning.call(this, fn, message);
};

var _controller_search_index = function (options = {}) {
	let fn = function controller_search_index (options = {}) {
		return this.protocol.api.initialize.SEARCH(options);
	};
	let message = 'CoreController.controller_search_index: Use CoreController.protocol.api.initialize.SEARCH, CoreController.meta.initialize.SEARCH or CoreController.meta.initialize_search instead';
	return wrapWithDeprecationWarning.call(this, fn, message);
};

var _controller_create = function (options = {}) {
	let fn = function controller_create (options = {}) {
		return this.protocol.api.initialize.CREATE(options);
	};
	let message = 'CoreController.controller_create: Use CoreController.protocol.api.initialize.CREATE, CoreController.meta.initialize.CREATE or CoreController.meta.initialize_create instead';
	return wrapWithDeprecationWarning.call(this, fn, message);
};

var _controller_cli = function (options = {}) {
	let fn = function controller_cli (options = {}) {
		return this.protocol.api.initialize.CLI(options);
	};
	let message = 'CoreController.controller_cli: Use CoreController.protocol.api.initialize.CLI, CoreController.meta.initialize.CLI or CoreController.meta.initialize_cli instead';
	return wrapWithDeprecationWarning.call(this, fn, message);
};

var _controller_update = function (options = {}) {
	let fn = function controller_update (options = {}) {
		return this.protocol.api.initialize.UPDATE(options);
	};
	let message = 'CoreController.controller_update: Use CoreController.protocol.api.initialize.UPDATE, CoreController.meta.initialize.UPDATE or CoreController.meta.initialize_update instead';
	return wrapWithDeprecationWarning.call(this, fn, message);
};

var _controller_remove = function (options = {}) {
	let fn = function controller_remove (options = {}) {
		return this.protocol.api.initialize.REMOVE(options);
	};
	let message = 'CoreController.controller_remove: Use CoreController.protocol.api.initialize.REMOVE, CoreController.meta.initialize.REMOVE or CoreController.meta.initialize_remove instead';
	return wrapWithDeprecationWarning.call(this, fn, message);
};

var _controller_load_model = function (options = {}) {
	let fn = function controller_load (options = {}) {
		options.population = ((options.population) ? options.population : options.load_model_population) || '';
		return this.protocol.api.initialize.LOAD(options);
	};
	let message = 'CoreController.controller_load: Use CoreController.protocol.api.initialize.LOAD, CoreController.meta.initialize.LOAD or CoreController.meta.initialize_load instead';
	return wrapWithDeprecationWarning.call(this, fn, message);
};

var _controller_load_model_with_population = function (options = {}) {
	let fn = function controller_load (options = {}) {
		options.population = ((options.population) ? options.population : options.load_multiple_model_population) || '';
		return this.protocol.api.initialize.LOAD(options);
	};
	let message = 'CoreController.controller_load: Use CoreController.protocol.api.initialize.LOAD, CoreController.meta.initialize.LOAD or CoreController.meta.initialize_load instead';
	return wrapWithDeprecationWarning.call(this, fn, message);
};

var _controller_model_query = function (options = {}) {
	let fn = function controller_model_query (options = {}) {
		options.population = ((options.population) ? options.population : options.load_multiple_model_population) || '';
		return this.protocol.api.initialize.PAGINATE(options);
	};
	let message = 'CoreController.controller_model_query: Use CoreController.protocol.api.initialize.PAGINATE, CoreController.meta.initialize.PAGINATE or CoreController.meta.initialize_paginate instead';
	return wrapWithDeprecationWarning.call(this, fn, message);
};

var _controller_load_model_with_count = function (options = {}) {
	let fn = function controller_load_model_with_count (options = {}) {
		return this.protocol.api.initialize.LOAD_WITH_COUNT(options);
	};
	let message = 'CoreController.controllerload_model_with_count: Use CoreController.protocol.api.initialize.LOAD_WITH_COUNT, CoreController.meta.initialize.LOAD_WITH_COUNT or CoreController.meta.initialize_load_with_count instead';
	return wrapWithDeprecationWarning.call(this, fn, message);
};

var _controller_load_model_with_default_limit = function (options = {}) {
	let fn = function controller_load_model_with_default_limit (options = {}) {
		return this.protocol.api.initialize.LOAD_WITH_LIMIT(options);
	};
	let message = 'CoreController.controller_load_model_with_default_limit: Use CoreController.protocol.api.initialize.LOAD_WITH_LIMIT, CoreController.meta.initialize.LOAD_WITH_LIMIT or CoreController.meta.initialize_load_with_limit instead';
	return wrapWithDeprecationWarning.call(this, fn, message);
};

var _controller_routes = function (options = {}) {
	let fn = function controller_routes (options = {}) {
		return this.protocol.api.implement(options);
	};
	let message = 'CoreController.controller_routes: Use CoreController.protocol.api.implement, CoreController.meta.initialize_routes or CoreController.protocol.implement instead (see periodicjs.core.protocols API docs for description of difference between methods)';
	return wrapWithDeprecationWarning.call(this, fn, message);
};

module.exports = {
	controller_edit: _controller_edit,
	controller_show: _controller_show,
	controller_new: _controller_new,
	controller_index: _controller_index,
	controller_search_index: _controller_search_index,
	controller_create: _controller_create,
	controller_cli: _controller_cli,
	controller_update: _controller_update,
	controller_remove: _controller_remove,
	controller_load_model: _controller_load_model,
	controller_load_model_with_population: _controller_load_model_with_population,
	controller_model_query: _controller_model_query,
	controller_load_model_with_count: _controller_load_model_with_count,
	controller_load_model_with_default_limit: _controller_load_model_with_default_limit,
	controller_routes: _controller_routes
};

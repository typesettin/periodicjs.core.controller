'use strict';
const Promisie = require('promisie');
const xss = require('xss');

const _SEARCH = function (options, cb) {
	try {
		let Model = options.model || this.model;
		let { sort, limit, population, fields, skip } = ['sort','limit','population','fields','skip'].reduce((result, key) => {
			result[key] = options[key] || this[key];
		}, {});
		Model.find((options.query && typeof options.query === 'object') ? options.query : {}, fields)
			.sort(sort)
			.skip(skip)
			.limit(limit)
			.populate(population)
			.exec(cb);
	}
	catch (e) {
		cb(e);
	}
};

const _STREAM = function (options, cb) {
	try {
		let Model = options.model || this.model;
		let { sort, limit, population, fields, skip } = ['sort','limit','population','fields','skip'].reduce((result, key) => {
			result[key] = options[key] || this[key];
		}, {});
		let stream = Model.find((options.query && typeof options.query === 'object') ? options.query : {}, fields)
			.sort(sort)
			.skip(skip)
			.limit(limit)
			.populate(population)
			.cursor();
		cb(null, stream);
	}
	catch (e) {
		cb(e);
	}
};

const _SEARCH_WITH_PAGINATION = function (options, cb) {
	try {
		let Model = options.model || this.model;
		let { sort, limit, population, fields, skip, pagelength } = ['sort','limit','population','fields','skip','pagelength'].reduce((result, key) => {
			result[key] = options[key] || this[key];
		}, {});
		let pages = {};
		let index = 0;
		Promisie.doWhilst(() => {
			return new Promisie((resolve, reject) => {
				_SEARCH.call(this, { sort, limit: pagelength, fields, skip, population, model: Model }, (err, data) => {
					if (err) reject(err);
					else {
						skip += data.length;
						pages[index++] = {
							documents: data,
							count: data.length
						};
						resolve(data.length);
					}
				});
			});
		}, current => current === pagelength)
			.then(() => cb(null, pages))
			.catch(cb);
	}
	catch (e) {
		cb(e);
	}
};

const _LOAD = function (options, cb) {
	try {
		let Model = options.model || this.model;
		let { sort, population, fields, docid } = ['sort','population','fields','docid'].reduce((result, key) => {
			result[key] = options[key] || this[key];
		}, {});
		let query = (options.query && typeof options.query === 'object') ? options.query : {
			[docid || '_id']: options.query
		};
		Model.findOne(query, fields)
			.sort(sort)
			.populate(population)
			.exec(cb);
	}
	catch (e) {
		cb(e);
	}
};

const _CREATE = function (options, cb) {
	try {
		let Model = options.model || this.model;
		let newdoc = options.newdoc || options;
		let xss_whitelist = (options.xss_whitelist) ? options.xss_whitelist : this.xss_whitelist;
		Model.create((xss_whitelist) ? JSON.parse(xss(JSON.stringify(newdoc), xss_whitelist)) : newdoc, cb);
	}
	catch (e) {
		cb(e);
	}
};

const _DELETE = function (options, cb) {
	try {
		let Model = options.model || this.model;
		let deleteid = options.deleteid || options.id;
		if (typeof deleteid !== 'string') throw new Error('Must specify "deleteid" or "id" for delete');
		Model.remove({ _id: deleteid }, cb); 
	}
	catch (e) {
		cb(e);
	}
};

const MONGO_ADAPTER = class Mongo_Adapter {
	constructor (options = {}) {
		this.docid = options.docid;
		this.model = options.model;
		this.sort = options.sort || '-createdat';
		this.limit = options.limit || 500;
		this.offset = options.offset || 0;
		this.population = options.population;
		this.fields = options.fields;
		this.pagelength = options.pagelength || 15;
		this.cache = options.cache;
		this.xss_whitelist = options.xss_whitelist || false;
		this._useCache = (options.useCache && options.cache) ? true : false;
	}
	search (options = {}, cb = false) {
		let _search = (options && options.paginate) ? _SEARCH_WITH_PAGINATION.bind(this) : _SEARCH.bind(this);
		if (typeof cb === 'function') _search(options, cb);
		else return Promisie.promisify(_search)(options);
	}
	stream (options = {}, cb = false) {
		let _stream = _STREAM.bind(this);
		if (typeof cb === 'function') _stream(options, cb);
		else return Promisie.promisify(_stream)(options);
	}
	load (options = {}, cb = false) {
		let _load = _LOAD.bind(this);
		if (typeof cb === 'function') _load(options, cb);
		else return Promisie.promisify(_load)(options);
	}
	update (options, cb) {

	}
	create (options = {}, cb = false) {
		let _create = _CREATE.bind(this);
		if (typeof cb === 'function') _create(options, cb);
		else return Promisie.promisify(_create)(options);
	}
	delete (options = {}, cb = false) {
		let _delete = _DELETE.bind(this);
		if (typeof cb === 'function') _delete(options, cb);
		else return Promisie.promisify(_delete)(options);
	}
};

module.exports = MONGO_ADAPTER;
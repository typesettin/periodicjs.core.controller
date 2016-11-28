'use strict';
const Promisie = require('promisie');

const MONGO_ADAPTER = class Mongo_Adapter {
	constructor (options) {
		this.model = options.model;
		this.sort = options.sort;
		this.limit = options.limit;
		this.population = options.population;
		this.fields = options.fields;
	}
	load (options, cb) {
		let Model = options.model || this.model;
		function _load () {

		};
		
	}
	search (options, cb) {

	}
	update (options, cb) {

	}
	create (options, cb) {

	}
	delete (options, cb) {

	}
};
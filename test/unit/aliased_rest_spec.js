'use strict';
const path = require('path');
const Promisie = require('promisie');
const mongoose = require('mongoose');
const ExampleSchema = require(path.join(__dirname, '../examples/example'));
const chai = require('chai');
const expect = chai.expect;
const CoreController = require(path.join(__dirname, '../../index'));

chai.use(require('chai-spies'));

var Example;
var connectDB = function () {
	return new Promisie((resolve, reject) => {
		if (mongoose.connection.readyState) resolve();
		else {
			mongoose.connect('mongodb://localhost/test_core_data');
			let db = mongoose.connection;
			db.on('error', reject)
				.once('open', resolve);
		}
	});
};

describe('Aliased REST Methods', function () {
	let controller;
	before(done => {
		connectDB()
			.then(() => {
				controller = new CoreController({
					settings: {
						theme: 'periodicjs.theme.default',
						application: {
							environment: 'test'
						},
						compatibility: false
					},
					logger: console
				});
				Example = mongoose.model('Example', ExampleSchema);
				done();
			}, done);
	});
	describe('controller_edit', function () {
		it('Should generate an "edit" view middleware', () => {
			let respondEdit = controller.controller_edit({
				model_name: path.join(__dirname, '../examples')
			});
			expect(respondEdit).to.be.a('function');
		});
	});
	describe('controller_show', function () {
		it('Should generate a "show" view middleware', () => {
			let respondShow = controller.controller_show({
				model_name: path.join(__dirname, '../examples')
			});
			expect(respondShow).to.be.a('function');
		});
	});
	describe('controller_new', function () {
		it('Should generate a "new" view middleware', () => {
			let respondNew = controller.controller_new({
				model_name: path.join(__dirname, '../examples')
			});
			expect(respondNew).to.be.a('function');
		});
	});
	describe('controller_index', function () {
		it('Should generate a "index" view middleware', () => {
			let respondIndex = controller.controller_index({
				model_name: path.join(__dirname, '../examples')
			});
			expect(respondIndex).to.be.a('function');
		});
	});
	describe('controller_search_index', function () {
		it('Should generate a "search_index" view middleware', () => {
			let respondSearch = controller.controller_search_index({
				model_name: path.join(__dirname, '../examples')
			});
			expect(respondSearch).to.be.a('function');
		});
	});
	describe('controller_create', function () {
		it('Should generate a "create" data middleware', () => {
			let respondCreate = controller.controller_create({
				model_name: 'example'
			});
			expect(respondCreate).to.be.a('function');
		});
	});
	describe('controller_cli', function () {
		it('Should generate a "cli" data middleware', () => {
			let respondCLI = controller.controller_cli({
				model_name: 'example'
			});
			expect(respondCLI).to.be.a('function');
		});
	});
	describe('controller_update', function () {
		it('Should generate a "update" data middleware', () => {
			let respondUpdate = controller.controller_update({
				model_name: 'example'
			});
			expect(respondUpdate).to.be.a('function');
		});
	});
	describe('controller_remove', function () {
		it('Should generate a "remove" data middleware', () => {
			let respondRemove = controller.controller_remove({
				model_name: 'example'
			});
			expect(respondRemove).to.be.a('function');
		});
	});
	describe('controller_load_model', function () {
		it('Should generate a "load_model" data middleware', () => {
			let respondShow = controller.controller_load_model({
				model_name: 'example'
			});
			expect(respondShow).to.be.a('function');
		});
	});
	describe('controller_load_model_with_population', function () {
		it('Should generate a "load_model_with_population" data middleware', () => {
			let respondLoadWithPopulation = controller.controller_load_model_with_population({
				model_name: 'example'
			});
			expect(respondLoadWithPopulation).to.be.a('function');
		});
	});
	describe('controller_model_query', function () {
		it('Should generate a "model_query" data middleware', () => {
			let respondQuery = controller.controller_model_query({
				model_name: 'example'
			});
			expect(respondQuery).to.be.a('function');
		});
	});
	describe('controller_load_model_with_count', function () {
		it('Should generate a "load_model_with_count" data middleware', () => {
			let respondWithCount = controller.controller_load_model_with_count({
				model_name: 'example'
			});
			expect(respondWithCount).to.be.a('function');
		});
	});
	describe('controller_load_model_with_default_limit', function () {
		it('Should generate a "load_model_with_default_limit" data middleware', () => {
			let respondWithLimit = controller.controller_load_model_with_default_limit({
				model_name: 'example'
			});
			expect(respondWithLimit).to.be.a('function');
		});
	});
	describe('controller_routes', function () {
		it('Should generate a "routes" data middleware', () => {
			let respondRoutes = controller.controller_routes({
				model_name: 'example'
			});
			expect(respondRoutes).to.be.an('object');
		});
	});
});
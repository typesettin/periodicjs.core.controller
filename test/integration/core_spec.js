'use strict';
const path = require('path');
const CoreController = require(path.join(__dirname, '../../index'));
const chai = require('chai');
const expect = chai.expect;
const ExampleSchema = require(path.join(__dirname, '../examples/example'));
const mongoose = require('mongoose');
const Promisie = require('promisie');
const moment = require('moment');
const express = require('express');

chai.use(require('chai-spies'));

var Example;
var Server;
var connectDB = function () {
	return new Promisie((resolve, reject) => {
		if (mongoose.connection.readyState) resolve();
		else {
			mongoose.connect('mongodb://localhost/test_core_controller');
			let db = mongoose.connection;
			db.on('error', reject)
				.once('open', resolve);
		}
	});
};

var startServer = function () {
	Server = express();
	return Promisie.promisify(Server.listen, Server)(3000);
};

describe('CoreController Integration', function () {
	let controller;
	let example;
	before(done => {
		Promisie.parallel({
			db_connect: connectDB,
			server_connect: startServer
		})
			.then(() => {
				Example = mongoose.model('Example', ExampleSchema);
				controller = new CoreController({
					settings: {
						theme: 'periodicjs.theme.default',
						application: {
							environment: 'test'
						}
					},
					logger: console
				}, {
					skip_responder: true,
					skip_db: true,
					skip_protocol: true
				});
				done();
			}, done);
	});
	it('Should be able to be initialized with no adapters', () => {
		expect(controller.responder).to.not.be.ok;
		expect(controller.db).to.deep.equal({});
		expect(controller.protocol).to.not.be.ok;
	});
	it('Should have meta and _utility_responder properties', () => {
		expect(controller._utility_responder).to.be.ok;
		expect(controller.meta).to.be.ok;
		expect(Object.keys(controller).indexOf('meta')).to.equal(-1);
		expect(Object.keys(controller).indexOf('_utility_responder')).to.equal(-1);
	});
	it('Should be able to initialize a protocol adapter', () => {
		controller.initialize_protocol();
		expect(controller.protocol).to.be.ok;
	});
	it('Should be able to initialize a responder', () => {
		controller.initialize_responder({
			responder_configuration: {
				adapter: 'json'
			}
		});
		expect(controller.responder).to.be.ok;
		expect(controller.protocol.responder).to.be.ok;
	});
	it('Should be able to initialize a db adapter', () => {
		controller.initialize_db({
			db_configuration: [{
				model_name: 'example',
				adapter: 'mongo',
				model: 'Example'
			}]
		});
		expect(controller.db).to.have.property('example');
		expect(controller.protocol.db).to.have.property('example');
	});
	it('Should be able to implement api strategies', () => {
		controller.protocol.implement();
		expect(controller.protocol.router).to.be.ok;
		expect(controller.protocol.controller).to.be.ok;
		let routes = controller.protocol.router.stack.reduce((result, layer) => {
			result[layer.route.path] = layer.route.stack;
			return result;
		}, {});
		expect(routes).to.have.property('/examples/new');
		expect(routes).to.have.property('/examples/edit');
		expect(routes).to.have.property('/examples/:id');
		expect(routes).to.have.property('/examples');
	});
	it('Should be able to access database query methods', done => {
		let person = {
			contact: {
				first_name: 'Distinct',
				last_name: 'Name',
				dob: moment('09/18/1990', 'MM/DD/YYYY').format()
			}
		};
		expect(controller.meta.createExample).to.be.a('function');
		controller.meta.createExample({ newdoc: person })
			.try(result => {
				expect(result).to.be.ok;
				example = result.toObject();
				expect(example.contact.first_name).to.equal('Distinct');
				done();
			})
			.catch(done);
	});
	it('Should be able to create controller methods', done => {
		expect(controller.meta.initialize_remove).to.be.a('function');
		let method = controller.meta.initialize_remove({
			model_name: 'example'
		});
		let originalRedirect;
		let reqFactory = function (originalUrl, redirecturl) {
			let req = { originalUrl, redirecturl, headers: {}, connection: {}, query: {} };
			let res = {
				status: chai.spy((num) => res),
				jsonp: chai.spy((data) => data),
				send: chai.spy((data) => data),
				redirect: chai.spy((endpoint) => endpoint)
			};
			req.is = (val) => (req.headers && req.headers['Content-Type'] && req.headers['Content-Type'] === val);
			return { req, res };
		};
		originalRedirect = controller.protocol.redirect.bind(controller.protocol);
		controller.protocol.redirect = chai.spy(originalRedirect);
		let { req, res } = reqFactory('periodicjs.net');
		req.controllerData = {
			example
		};
		method(req, res)
			.try(() => {
				expect(controller.protocol.redirect).to.have.been.called();
				return Promisie.promisify(Example.findById, Example)(example._id);
			})
			.try(result => {
				expect(result).to.not.be.ok;
				controller.protocol.redirect = originalRedirect;
				done();
			})
			.catch(done)
	});
});

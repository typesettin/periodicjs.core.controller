'use strict';
const path = require('path');
const CoreController = require(path.join(__dirname, '../../index'));
const chai = require('chai');
const expect = chai.expect;
const Promisie = require('promisie');
const fs = Promisie.promisifyAll(require('fs-extra'));

chai.use(require('chai-spies'));

describe('Aliased Protocol Methods', function () {
	let controller;
	before(() => {
		controller = new CoreController({
			settings: {
				theme: 'periodicjs.theme.default',
				application: {
					environment: 'test'
				}
			},
			logger: console
		});
	});
	after(done => {
		Promisie.all(fs.removeAsync(path.join(__dirname, '../examples/template.ejs')), fs.removeAsync(path.join(__dirname, '../examples/test_template.ejs')))
			.then(() => done(), done);
	});
	describe('getPluginViewDefaultTemplate', function () {
		let originalRender;
		before(done => {
			originalRender = controller._utility_responder.render.bind(controller._utility_responder);
			controller._utility_responder.render = chai.spy(originalRender);
			fs.writeFileAsync(path.join(__dirname, '../examples/template.ejs'), 'Hello <%- name %>')
				.then(() => done())
				.catch(done);
		});
		after(() => {
			controller._utility_responder.render = originalRender;
		});
		it('Should be a function', () => {
			expect(controller.getPluginViewDefaultTemplate).to.be.a('function');
		});
		it('Should be able to get a valid file path', done => {
			controller.getPluginViewDefaultTemplate({
				viewname: 'examples/template',
				viewfileext: '.ejs',
				dirname: [path.join(__dirname, '../')]
			})
				.try(result => {
					expect(result).to.equal(path.join(__dirname, '../examples/template.ejs'))
					expect(controller._utility_responder.render).to.have.been.called.once;
					done();
				})
				.catch(done);
		});
		it('Should resolve with viewname if no paths are valid', done => {
			controller.getPluginViewDefaultTemplate({
				viewname: 'examples/template',
				viewfileext: '.ejs'
			})
				.try(result => {
					expect(result).to.equal('examples/template');
					expect(controller._utility_responder.render).to.have.been.called.twice;
					done();
				})
				.catch(done);
		});
	});
	describe('respondInKind', function () {
		let originalError;
		let originalRespond;
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
		before(() => {
			originalError = controller.protocol.error.bind(controller.protocol);
			originalRespond = controller.protocol.respond.bind(controller.protocol);
			originalRedirect = controller.protocol.redirect.bind(controller.protocol);
			controller.protocol.error = chai.spy(originalError);
			controller.protocol.respond = chai.spy(originalRespond);
			controller.protocol.redirect = chai.spy(originalRedirect);
		});
		after(() => {
			controller.protocol.error = originalError;
			controller.protocol.respond = originalRespond;
			controller.protocol.redirect = originalRedirect;
		});
		it('Should be a function', () => {
			expect(controller.respondInKind).to.be.a('function');
		});
		it('Should call redirect if req.redirecturl is defined and request does have a html content-type', done => {
			let { req, res } = reqFactory('periodicjs.com', 'periodicjs.net/member/account');
			let redirect = controller.respondInKind({ req, res });
			expect(controller.protocol.redirect).to.have.been.called.with(req);
			expect(res.redirect).to.have.been.called.with('periodicjs.net/member/account');
			done();
		});
		it('Should call respond if req.redirecturl is not defined and content-type is not html', done => {
			let { req, res } = reqFactory('periodicjs.com');
			controller.respondInKind({
				responseData: { hello: 'world' },
				req, res
			})
				.try(() => {
					expect(controller.protocol.respond).to.have.been.called();
					expect(res.status).to.have.been.called.with(200);
					done();
				})
				.catch(done);
		});
		it('Should call the callback function if options is passed', done => {
			let { req, res } = reqFactory('periodicjs.com');
			let callback = function (_req, _res, result) {
				expect(result).to.have.property('result');
				expect(result).to.have.property('data');
				expect(result.data).to.have.property('hello');
				done();
			};
			controller.respondInKind({ req, res, responseData: { hello: 'world' }, callback });
		});
		it('Should call the callback if it is passed as second argument', done => {
			let { req, res } = reqFactory('periodicjs.com');
			controller.respondInKind({ req, res, responseData: { hello: 'world' } }, (_req, _res, result) => {
				expect(result).to.have.property('result');
				expect(result).to.have.property('data');
				expect(result.data).to.have.property('hello');
				done();
			});
		});
		it('Should call the callback if request is html content-type', done => {
			let { req, res } = reqFactory('periodicjs.com');
			req.headers['Content-Type'] = 'html';
			let callback = function (_req, _res, result ) {
				expect(result).to.have.property('result');
				expect(result).to.have.property('data');
				expect(result.data).to.have.property('hello');
				done();
			};
			controller.respondInKind({ req, res, responseData: { hello: 'world' }, callback });
		});
	});
	describe('handleDocumentQueryRender', function () {
		let originalRender;
		let originalError;
		let originalRespond;
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
		before(done => {
			originalRender = controller._utility_responder.render.bind(controller._utility_responder);
			controller._utility_responder.render = chai.spy(originalRender);
			originalError = controller.protocol.error.bind(controller.protocol);
			originalRespond = controller.protocol.respond.bind(controller.protocol);
			originalRedirect = controller.protocol.redirect.bind(controller.protocol);
			controller.protocol.error = chai.spy(originalError);
			controller.protocol.respond = chai.spy(originalRespond);
			controller.protocol.redirect = chai.spy(originalRedirect);
			fs.writeFileAsync(path.join(__dirname, '../examples/test_template.ejs'), 'Hello World')
				.then(() => {
					done();
				}, done);
		});
		after(() => {
			controller._utility_responder.render = originalRender;
			controller.protocol.error = originalError;
			controller.protocol.respond = originalRespond;
			controller.protocol.redirect = originalRedirect;
		});
		it('Should be a function', () => {
			expect(controller.handleDocumentQueryRender).to.be.a('function');
		});
		it('Should render a template and respond with html', done => {
			let { req, res } = reqFactory('periodicjs.com');
			controller.handleDocumentQueryRender({
				viewfileext: '.ejs',
				viewname: 'examples/test_template',
				dirname: path.join(__dirname, '../'),
				req, res
			})
				.try(result => {
					expect(controller.protocol.respond).to.have.been.called.with({ responder_override: result });
					expect(result).to.equal('Hello World');
					done();
				})
				.catch(done);
		});
		it('Should use callback if argument is passed', done => {
			let { req, res } = reqFactory('periodicjs.com');
			controller.handleDocumentQueryRender({
				viewfileext: '.ejs',
				viewname: 'examples/test_template',
				dirname: path.join(__dirname, '../'),
				req, res
			}, (err, result) => {
				if (err) done(err);
				else {
					expect(controller.protocol.respond).to.have.been.called.with({ responder_override: result });
					expect(result).to.equal('Hello World');
					done();
				}
			});
		});
	});
	describe('renderView', function () {
		let originalRender;
		let originalError;
		let originalRespond;
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
		before(() => {
			originalRender = controller._utility_responder.render.bind(controller._utility_responder);
			controller._utility_responder.render = chai.spy(originalRender);
			originalError = controller.protocol.error.bind(controller.protocol);
			originalRespond = controller.protocol.respond.bind(controller.protocol);
			originalRedirect = controller.protocol.redirect.bind(controller.protocol);
			controller.protocol.error = chai.spy(originalError);
			controller.protocol.respond = chai.spy(originalRespond);
			controller.protocol.redirect = chai.spy(originalRedirect);
		});
		after(() => {
			controller._utility_responder.render = originalRender;
			controller.protocol.error = originalError;
			controller.protocol.respond = originalRespond;
			controller.protocol.redirect = originalRedirect;
		});
		it('Should be a function', () => {
			expect(controller.renderView).to.be.a('function');
		});
		it('Should be able to render a view', done => {
			let { req, res } = reqFactory('periodicjs.com');
			controller.renderView(req, res, path.join(__dirname, '../examples/template'), {
				name: 'Ricky'
			})
				.try(() => {
					expect(controller._utility_responder.render).to.have.been.called();
					expect(controller.protocol.respond).to.have.been.called();
					done();
				})
				.catch(done);
		});
	});
	describe('getViewModelProperties', function () {
		it('Should return an object containing inflected versions of model name', function () {
			let inflected = controller.getViewModelProperties({ model_name: 'customer' });
			expect(inflected).to.be.an('object');
			expect(inflected).to.have.property('name');
			expect(inflected).to.have.property('name_plural');
			expect(inflected).to.have.property('capital_name');
			expect(inflected).to.have.property('page_plural_title');
			expect(inflected).to.have.property('page_plural_count');
			expect(inflected).to.have.property('page_plural_query');
			expect(inflected).to.have.property('page_single_count');
			expect(inflected).to.have.property('page_pages');
			expect(inflected.name_plural).to.equal('customers');
			expect(inflected.capital_name).to.equal('Customer');
			expect(inflected.page_plural_title).to.equal('Customers');
		});
	});
});

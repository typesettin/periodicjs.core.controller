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
		fs.removeAsync(path.join(__dirname, '../examples/template.ejs'))
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
});
'use strict';
const path = require('path');
const CoreController = require(path.join(__dirname, '../../index'));
const chai = require('chai');
const expect = chai.expect;

chai.use(require('chai-spies'));

describe('Aliased Logger Methods', function () {
	let controller;
	let spies = {};
	before(() => {
		spies.error = {
			original: console.error.bind(console),
			spy: chai.spy(console.error.bind(console))
		};
		spies.warn = {
			original: console.warn.bind(console),
			spy: chai.spy(console.warn.bind(console))
		};
		console.error = spies.error.spy;
		console.warn = spies.warn.spy;
		controller = new CoreController({
			settings: {
				theme: 'periodicjs.theme.default',
				application: {
					environment: 'test'
				},
				compatibility: false
			},
			logger: console,
		});
	});
	after(() => {
		console.error = spies.error.original;
		console.warn = spies.warn.original;
	});
	describe('logError', function () {
		it('Should have a logError method', () => {
			expect(controller.logError).to.be.a('function');
		});
		it('Should be able to log an error', () => {
			let req = {
				headers: {},
				connection: {},
				originalUrl: 'test.url.com'
			};
			controller.logError({
				req,
				res: {},
				err: new Error('Some Test Error')
			});
			expect(spies.error.spy).to.have.been.called.with('Some Test Error');
		});
		it('Should be also be accessible by the "meta" property', () => {
			let req = {
				headers: {},
				connection: {},
				originalUrl: 'test.url.com'
			};
			controller.meta.error(req, {}, { err: new Error('Some Test Error -- META') });
			expect(spies.error.spy).to.have.been.called.with('Some Test Error -- META');
		});
	});
	describe('logWarning', function () {
		it('Should have a logWarning method', () => {
			expect(controller.logWarning).to.be.a('function');
		});
		it('Should be able to log an error', () => {
			let req = {
				headers: {},
				connection: {},
				originalUrl: 'test.url.com'
			};
			controller.logWarning({
				req,
				res: {},
				err: new Error('Some Test Warning')
			});
			expect(spies.warn.spy).to.have.been.called.with('Some Test Warning');
		});
		it('Should be also be accessible by the "meta" property', () => {
			let req = {
				headers: {},
				connection: {},
				originalUrl: 'test.url.com'
			};
			controller.meta.warn(req, {}, { err: new Error('Some Test Warning -- META') });
			expect(spies.warn.spy).to.have.been.called.with('Some Test Warning -- META');
		});
	});
});

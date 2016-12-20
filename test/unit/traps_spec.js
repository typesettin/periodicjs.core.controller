'use strict';
const path = require('path');
const initialize_traps = require(path.join(__dirname, '../../utility/traps'));
const chai = require('chai');
const expect = chai.expect;

describe('initialize_traps.js', function () {
	let proxy;
	before(() => {
		proxy = new Proxy({}, initialize_traps({
			db: {
				default: {
					query: () => 'query'
				},
				example: {
					load: () => 'load'
				}
			},
			protocol: {
				api: {
					implement: function () {
						return 'initialize_routes'
					},
					initialize: {
						NEW: function () {
							return 'new';
						}
					}
				},
				implement: () => 'implement'
			},
			somemethod: () => 'somemethod',
			logger: console
		}));
	});
	it('Should not allow for property assignments on inaccessible properties', () => {
		proxy.protocol = true;
		expect(proxy.protocol).to.not.equal(true);
	});
	it('Should access properties directly if it is a direct path', () => {
		let protocol = proxy.protocol;
		expect(protocol).to.be.an('object');
		expect(protocol).to.have.property('api');
		expect(protocol).to.have.property('implement');
	});
	it('Should access db adapter methods on default db adapter', () => {
		let query = proxy.query;
		expect(query).to.be.a('function');
		expect(query()).to.equal('query');
	});
	it('Should access specific db adapter methods if model name is included in property', () => {
		let loadExample = proxy.loadExample;
		expect(loadExample).to.be.a('function');
		expect(loadExample()).to.equal('load');
	});
	it('Should return api implementation methods if prefaced by initialize_', () => {
		let implement = proxy.initialize_routes;
		expect(implement).to.be.a('function');
		expect(implement()).to.equal('initialize_routes');
		let implement_new = proxy.initialize_new;
		expect(implement_new()).to.equal('new');
	});
	it('Should search child adapters for methods', () => {
		let implement = proxy.implement;
		expect(implement).to.be.a('function');
		expect(implement()).to.equal('implement');
	});
	it('Should search parent for methods if not found in children', () => {
		let method = proxy.somemethod;
		expect(method).to.be.a('function');
		expect(method()).to.equal('somemethod');
	});
});

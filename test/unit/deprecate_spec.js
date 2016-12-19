'use strict';
const path = require('path');
const deprecate = require(path.join(__dirname, '../../utility/deprecate'));
const chai = require('chai');
const expect = chai.expect;

describe('deprecate.js', function () {
	it('Should return a function', () => {
		let deprecated = deprecate(function () {
			console.log('hello world');	
		}, 'hello world');
		expect(deprecated).to.be.a('function');
	});
	it('Should bind "this" to the context of the returned function', () => {
		let _this = Symbol('fizzbuzz');
		let deprecated = deprecate.call(_this, function () {
			return this;
		}, 'none');
		expect(deprecated() === _this).to.be.true;
	});
	it('Should flash the message passed in arguments as part of deprecated warning', done => {
		let deprecated = deprecate(function () {
			return true;	
		}, 'hello world');
		let handler = function handler (data) {
			expect(data.name).to.equal('DeprecationWarning');
			expect(/hello world/.test(data.stack.toString())).to.be.true;
			process.removeListener('warning', handler);
			done();
		};
		process.on('warning', handler);
		deprecated();
	});
	it('Should only flash message the correct amount of times', done => {
		let called = 0;
		let val = 0;
		let deprecated = deprecate(function () {
			called++;
			if (called === 4) {
				let timeout = setTimeout(function () {
					process.removeListener('warning', handler);
					expect(val).to.equal(3);
					done();
					clearTimeout(timeout);
				}, 250);
			}
		}, 'hello world', 3);
		let handler = function handler (data) {
			expect(data.name).to.equal('DeprecationWarning');
			val++;
		};
		process.on('warning', handler);
		for (let i = 0; i < 4; i++) deprecated();
	});
});
'use strict';
const path = require('path');
const initialize_traps = require(path.join(__dirname, '../../utility/traps'));
const chai = require('chai');
const expect = chai.expect;

chai.use(require('chai-spies'));

describe('initialize_traps.js', function () {
	it('Should return a proxy', () => {

	});
	it('Should not allow for property assignments on inacccessible properties', () => {

	});
	it('Should access properties directly if it is a direct path', () => {

	});
	it('Should access db adapter methods on default db adapter', () => {

	});
	it('Should access specific db adapter methods if model name is included in property', () => {

	});
	it('Should return api implementation methods if prefaced by initialize_', () => {

	});
	it('Should search child adapters for methods', () => {

	});
});

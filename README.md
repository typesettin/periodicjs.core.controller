# periodicjs.core.controller
[![Build Status](https://travis-ci.org/typesettin/periodicjs.core.controller.svg?branch=master)](https://travis-ci.org/typesettin/periodicjs.core.controller) [![NPM version](https://badge.fury.io/js/periodicjs.core.controller.svg)](http://badge.fury.io/js/periodicjs.core.controller) [![Coverage Status](https://coveralls.io/repos/github/typesettin/periodicjs.core.controller/badge.svg?branch=master)](https://coveralls.io/github/typesettin/periodicjs.core.controller?branch=master)  [![Join the chat at https://gitter.im/typesettin/periodicjs.core.data](https://badges.gitter.im/typesettin/periodicjs.core.controller.svg)](https://gitter.im/typesettin/periodicjs.core.controller?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

### Description
Periodic's Core Controller module, provides helpful controller methods for querying documents and rendering responses.

Extensions are node modules that are loaded when an instance of periodic is instantiated.

### Installation
```sh
$ npm i periodicjs.core.controller
```

### [Full Documentation](https://github.com/typesettin/periodicjs.core.controller/blob/master/doc/api.md)

### Usage (basic)
```javascript
const CoreController = require('periodicjs.core.controller');
const core_controller = new CoreController(resources);
const mongoose = require('mongoose');
const User = mongoose.model('User');

//Querying the Database
//1. using aliased methods
core_controller.loadModel({
	docid: 'email',
	model: User,
	query: 'somerandomemail@email.com'
})
	.then(result => {
		//The result of the query
	});
//2. using methods directly
core_controller.db.default.load({
	docid: 'email',
	model: User,
	query: 'somerandomemail@email.com'
})
	.then(result => {
		//The result of the query
	});
//3. using the meta property
core_controller.meta.load({
	docid: 'email',
	model: User,
	query: 'somerandomemail@email.com'
})
	.then(result => {
		//The result of the query
	});

//Implementing Routes
//1. using aliased methods
let initialized = core_controller.controller_routes({
	model_name: 'user'
});
/*
 initialized -> {
 		router: //express router
 		new: //middleware
		show: //middleware
		edit: //middleware
		index: //middleware
		remove: //middleware
		search: //middleware
		create: //middleware
		update: //middleware
		load: //middleware
		load_with_count: //middleware
		load_with_limit: //middleware
		paginate: //middleware
 }
 */
//2. using methods directly
let initialized = core_controller.protocol.api.implement({
	model_name: 'user'
});
//3. using the meta property
let initialized = core_controller.meta.initialize_routes({
	model_name: 'user'
});

//Rendering a View
//1. using aliased methods
core_controller.renderView(req, res, 'examples/helloworld', {
	name: 'user'
});
//2. using the utility responder
core_controller._utility_responder.render({
	name: 'user'
}, {
	viewname: 'examples/helloworld'
})
	.then(result => {
		core_controller.protocol.respond(req, res, { responder_override: result });
	});
//3. rendering a from a different template engine
core_controller._utility_responder.engine = require('pug');
core_controller._utility_responder.render({
	name: 'user'
}, {
	viewname: 'examples/helloworld',
	extname: '.pug',
})
	.then(result => {
		core_controller.protocol.respond(req, res, { responder_override: result });
	});
```
### Usage (advanced)
```javascript
const CoreController = require('periodicjs.core.controller');
const mongoose = require('mongoose');
const User = mongoose.model('User');

//Configurations for protocol, db, and responder can be passed at startup
var core_controller = new CoreController(resource, {
	db_configuration: [{
		model_name: 'user',
		model: 'User',
		docid: 'email',
		adapter: 'mongo'
	}],
	protocol_configuration: {
		adapter: 'http',
		api: 'rest'
	}
});
//Or they can be initialized individually
core_controller.initialize_db({
	model_name: 'user',
	model: 'User',
	docid: 'email',
	adapter: 'mongo'
});
core_controller.initialize_responder({ adapter: 'json' });

//Querying the Database
//1. Using the initialized db adapter
/*
	As you can see with initialized adapters there is no need to pass model, model_name or other generically required options
 */
core_controller.db.user.load({
	query: 'somerandomemail@email.com'
})
	.then(result => {
		//result of query
	});
//2. Using the meta property
core_controller.meta.loadUser({
	query: 'somerandomemail@email.com'
})
	.then(result => {
		//result of query
	});

//Implementing Routes
//1. Using the initialized protocol adapter
/*
	This will implement a RESTful API route strategy for all initialized db adapters. You can access the initialized router at core_controller.protocol.router;
 */
core_controller.protocol.implement();
//2. Using the API adapter
/*
	This returns an express router for the user model
 */
var router = core_controller.protocol.api.implement({ model_name: 'user' });
/*
 	Individual controller methods can also be access via aliased methods, the meta property and the api adapter:
 	core_controller.protocol.api.implement.INDEX({ model_name: 'user' });
 	core_controller.meta.initialize_index({ model_name: 'user' });
 	core_controller.controller_index({ model_name: 'user' });
 */

```
### Default Adapters
```javascript
/*
	The new CoreController uses abstractions called adapters which allows for standardization of method names with differing functionality.  For example the periodicjs.core.data modules exposes adapters that have CRUD methods for various database types ie. MongoDB, SQL, PostgreSQL while periodicjs.core.protocols exposes adapters for request types ie. HTTP, Web Socket and for API strategies ie. REST, JSON RPC, XML RPC. As such CoreController itself does not have access to many methods without initialized adapters, but for convenience CoreController will initialize a set of default adapters even if configurations are not provided.
 */
const CoreController = require('periodicjs.core.controller');
const core_controller = new CoreController(resources);
/*
	Even without adapter configurations core_controller will have a .protocol, .responder and .db.default property. With these default adapters core_controller has exposed methods for implementing routing, middleware, CRUD methods etc.
	By default:
		- .protocol is a HTTP request adapter with a REST API adapter
		- .responder is a JSON adapter
		- .db.defualt is a MongoDB adapter with no specified default model
		- Additionally, there is a HTML adapter available at core_controller._utility_responder

	This default functionality can be overridden by passing options.skip_responder, options.skip_db and options.skip_protocol as true
 */
```
### Compatibility Mode
By default CoreController will instantiate a version of v7.5.1 and make all prototype methods indexed by their original name. This is to ensure that older versions of periodicjs and its extensions and core modules are compatible with the newest version of periodicjs.core.controller
```javascript
//Compatibility mode can be disabled at initialization
const CoreController = require('periodicjs.core.controller');

var core_controller = new CoreController(resources, {
	compatibility: false
});
//Even with compatibility mode off a sub-set of aliased methods are available (see aliased method documentation for a complete list)

//You can also instantiate the v7.5.1 CoreController only
var compatible_core_controller = new CoreController.compatibility(resources);
```
### Magical .meta Property
```javascript
const CoreController = require('periodicjs.core.controller');
const mongoose = require('mongoose');
const User = mongoose.model('User');

//Configurations for protocol, db, and responder can be passed at startup
var core_controller = new CoreController(resource, {
	db_configuration: [{
		model_name: 'user',
		model: 'User',
		docid: 'email',
		adapter: 'mongo'
	}]
});

/*
	The .meta property on core_controller is a proxy that allows for sudo-aliasing of methods for easier access to methods nested in child objects
 */
//There are four main points of access when using the meta property:
//1. Accessing nested methods
core_controller.meta.render //-> Child protocol adapters are searched for the .render method and if it is found a bound copy of the function is returned

//2. Accessing controller implementation functions
core_controller.meta.initialize_index //-> If the property follows the syntax "initialize" + "_" + keyword representing controller implementation ie. new, index, edit a bound copy of the api adapter utility method will be returned
core_controlle.meta.initialize = {} //All API utility methods indexed by method name

//3. Accessing CRUD methods
core_controller.meta.load //-> searches the controller.db.default object for a .load method and returns it
core_controller.meta.loadUser //-> If the "user" model adapter has been loaded sudo-aliased methods are available ie. loadUser, createUser, updateUser

//4. Direct Access
core_controller.meta.protocol = core_controller.protocol //-> Any properties that exist on core_controller are also accessible from the meta property
```
### Development
*Make sure you have grunt installed*
```sh
$ npm i -g grunt-cli jsdoc-to-markdown
```

For generating documentation
```sh
$ grunt doc
$ jsdoc2md lib/**/*.js utility/**/*.js index.js > doc/api.md
```
### Notes
* Check out [https://github.com/typesettin/periodicjs](https://github.com/typesettin/periodicjs) for the full Periodic Documentation

### Testing
```sh
$ npm i
$ grunt test
```
### Contributing
License
----

MIT

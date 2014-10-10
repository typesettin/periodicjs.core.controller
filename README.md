# periodicjs.core.controller

Periodic's Core Controller module, provides helpful controller methods for querying documents and rendering responses.

Extensions are node modules that are loaded when an instance of periodic is instantiated.

 [API Documentation](https://github.com/typesettin/periodicjs.core.controller/blob/master/doc/api.md)

## Installation

```
$ npm install periodicjs.core.controller
```

This is a part of Periodic's core.

## Usage

### Querying for tag
*JavaScript*
```javascript
var Controller = require('periodicjs.core.controller'),
	CoreController = new ControllerHelper(resources),
	Tag = mongoose.model('Tag');
req.controllerData = (req.controllerData) ? req.controllerData : {};

CoreController.loadModel({
		docid: 'news',
		model: Tag,
		population: 'contenttypes parent',
		callback: function (err, doc) {
			if (err) {
				CoreController.handleDocumentQueryErrorResponse({
					err: err,
					res: res,
					req: req
				});
			}
			else {
				req.controllerData.tag = doc;
				next();
			}
		}
	});
```

##Development
*Make sure you have grunt installed*
```
$ npm install -g grunt-cli
```

Then run grunt watch
```
$ grunt watch
```

##Notes
* Check out https://github.com/typesettin/periodicjs for the full Periodic Documentation
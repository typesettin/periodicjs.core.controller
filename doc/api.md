## Classes

<dl>
<dt><a href="#CORE">CORE</a> : <code>Core</code></dt>
<dd><p>CoreController - a class that handles implementing API strategies and providing CRUD operation convenience methods and middleware</p>
</dd>
</dl>

## Functions

<dl>
<dt><a href="#_INITIALIZE_UTILITY_RESPONDER">_INITIALIZE_UTILITY_RESPONDER()</a></dt>
<dd><p>Initializes a utility HTML responder adapter that is used to render templates if protocol responder is not an HTML adapter and set it to the &quot;_utility_responder&quot; property. This property is not writable, configurable or enumerable</p>
</dd>
<dt><a href="#_INITIALIZE_ALIASED_UTILITIES">_INITIALIZE_ALIASED_UTILITIES()</a></dt>
<dd><p>Initializes aliased utility methods and set the on &quot;this&quot;</p>
</dd>
<dt><a href="#_STARTUP">_STARTUP(options)</a> ⇒ <code>Object</code></dt>
<dd><p>Called a initialization of a &quot;new&quot; CoreController. Implements the &quot;meta&quot; property which grants additional access to child adapter metods through a Proxy. Initialized adapters according to configurations and default adapters</p>
</dd>
<dt><a href="#_loadModel">_loadModel()</a> ⇒ <code>Fuction</code></dt>
<dd><p>Creates a function that takes configurable options and queries the database for a single document. Alias for CoreController.db.default.load or CoreController.meta.load</p>
</dd>
<dt><a href="#_searchModel">_searchModel()</a> ⇒ <code>Fuction</code></dt>
<dd><p>Creates a function that takes configurable options and queries the database for multiple documents. Alias for CoreController.db.default.search or CoreController.meta.search</p>
</dd>
<dt><a href="#_createModel">_createModel()</a> ⇒ <code>Fuction</code></dt>
<dd><p>Creates a function that takes configurable options and creates a document. Alias for CoreController.db.default.create or CoreController.meta.create</p>
</dd>
<dt><a href="#_updateModel">_updateModel()</a> ⇒ <code>Fuction</code></dt>
<dd><p>Creates a function that takes configurable options and updates a document. Alias for CoreController.db.default.update or CoreController.meta.update</p>
</dd>
<dt><a href="#_deleteModel">_deleteModel()</a> ⇒ <code>Fuction</code></dt>
<dd><p>Creates a function that takes configurable options and deletes a document. Alias for CoreController.db.default.delete or CoreController.meta.delete</p>
</dd>
<dt><a href="#_logError">_logError()</a> ⇒ <code>function</code></dt>
<dd><p>Logs an error. Alias for CoreController.protocol.error or CoreController.meta.error</p>
</dd>
<dt><a href="#_logWarning">_logWarning()</a> ⇒ <code>function</code></dt>
<dd><p>Logs a warning. Alias for CoreController.protocol.warn or CoreController.meta.warn</p>
</dd>
<dt><a href="#_getPluginViewDefaultTemplate">_getPluginViewDefaultTemplate()</a> ⇒ <code>function</code></dt>
<dd><p>Creates a function that will resolve a template file path from a set of directories. Alias for CoreController._utility_responder.render</p>
</dd>
<dt><a href="#_respondInKind">_respondInKind()</a> ⇒ <code>function</code></dt>
<dd><p>Creates a function that will send a HTTP response or return a formatted response object. Alias for CoreController.protocol.respond</p>
</dd>
<dt><a href="#_handleDocumentQueryRender">_handleDocumentQueryRender()</a> ⇒ <code>function</code></dt>
<dd><p>Creates a function that will render a template and send HTTP response to client. Alias for CoreController._utility_responder.render</p>
</dd>
<dt><a href="#_handleDocumentQueryErrorResponse">_handleDocumentQueryErrorResponse()</a> ⇒ <code>function</code></dt>
<dd><p>Creates a function that will render an error view from a template. Alias for CoreController._utility_responder.error</p>
</dd>
<dt><a href="#_renderView">_renderView()</a> ⇒ <code>function</code></dt>
<dd><p>Creates a function that will render data from a view put can accept additional data for the template and always send a response. Alias for CoreController.protocol.respond</p>
</dd>
<dt><a href="#_getViewModelProperties">_getViewModelProperties()</a> ⇒ <code>function</code></dt>
<dd><p>Creates a function that will get inflected values from a given string</p>
</dd>
</dl>

<a name="CORE"></a>

## CORE : <code>Core</code>
CoreController - a class that handles implementing API strategies and providing CRUD operation convenience methods and middleware

**Kind**: global class  

* [CORE](#CORE) : <code>Core</code>
    * [new CORE(resources, options)](#new_CORE_new)
    * [.initialize_responder(options)](#CORE+initialize_responder) ⇒ <code>Object</code>
    * [.initialize_protocol(options, [utilities])](#CORE+initialize_protocol) ⇒ <code>Object</code>
    * [.initialize_db(options)](#CORE+initialize_db) ⇒ <code>Object</code>

<a name="new_CORE_new"></a>

### new CORE(resources, options)
Contructs a new Core instance


| Param | Type | Description |
| --- | --- | --- |
| resources | <code>Object</code> | Periodicjs shared resources |
| resources.logger | <code>Object</code> | A logger module that should be used in logging errors, info and warns |
| resources.settings | <code>Object</code> | Contains various application settings including theme and environment specific configurations |
| resources.settings.compatibility | <code>Boolean</code> | If strictly false compatibility mode CoreController will not be initialized and all alias methods will reference their v10 counterparts |
| resources.app | <code>Object</code> | Should contain a locals property that has local data to be shared with constructed object |
| options | <code>Object</code> | Configurable options for adapters and overrides |
| options.compatibility | <code>Boolean</code> | If strictly false compatibility mode CoreController will not be initialized and all alias methods will reference their v10 counterparts |

<a name="CORE+initialize_responder"></a>

### corE.initialize_responder(options) ⇒ <code>Object</code>
Initializes a responder and assigns it to the .responder property on "this". The active responder will also be used as the responder for any protocol adapters initialized after this is called

**Kind**: instance method of <code>[CORE](#CORE)</code>  
**Returns**: <code>Object</code> - "this"  

| Param | Type | Description |
| --- | --- | --- |
| options | <code>Object</code> | Configurable options for responder (see periodicjs.core.responder for more details) |
| options.responder_configuration | <code>Object</code> | Configuration for response adapter |

<a name="CORE+initialize_protocol"></a>

### corE.initialize_protocol(options, [utilities]) ⇒ <code>Object</code>
Initializes a protcol adapter and assigns it to the .protocol property on "this". The active protocol adapter is used for sending responses to the client and for setting up an API strategy

**Kind**: instance method of <code>[CORE](#CORE)</code>  
**Returns**: <code>Object</code> - "this"  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| options | <code>Object</code> |  | Configurable options for protocol adapter (see periodicjs.core.protocols for more details) |
| options.protocol_configuration | <code>Object</code> |  | Configuration for protocol adapter |
| [utilities] | <code>Object</code> | <code>CoreUtilities</code> | A set of utility methods that should be accessible by protocol adapter |

<a name="CORE+initialize_db"></a>

### corE.initialize_db(options) ⇒ <code>Object</code>
Initializes database adapters for each given model in configuration and assigns them to the this.db object indexed by model name and assigns a default mongo adapter to the .default property on this.db

**Kind**: instance method of <code>[CORE](#CORE)</code>  
**Returns**: <code>Object</code> - "this"  

| Param | Type | Description |
| --- | --- | --- |
| options | <code>Object</code> | Configurable options for db adapters (see periodicjs.core.data for more details) |
| options.db_configuration | <code>Object</code> | Configuration for db adapters |

<a name="_INITIALIZE_UTILITY_RESPONDER"></a>

## _INITIALIZE_UTILITY_RESPONDER()
Initializes a utility HTML responder adapter that is used to render templates if protocol responder is not an HTML adapter and set it to the "_utility_responder" property. This property is not writable, configurable or enumerable

**Kind**: global function  
<a name="_INITIALIZE_ALIASED_UTILITIES"></a>

## _INITIALIZE_ALIASED_UTILITIES()
Initializes aliased utility methods and set the on "this"

**Kind**: global function  
<a name="_STARTUP"></a>

## _STARTUP(options) ⇒ <code>Object</code>
Called a initialization of a "new" CoreController. Implements the "meta" property which grants additional access to child adapter metods through a Proxy. Initialized adapters according to configurations and default adapters

**Kind**: global function  
**Returns**: <code>Object</code> - "this"  

| Param | Type | Description |
| --- | --- | --- |
| options | <code>Object</code> | Configuration options for adapters |
| options.skip_responder | <code>Boolean</code> | If true responder adapters will not be initialized |
| options.skip_db | <code>Boolean</code> | If true db adapters will not be initialized |
| options.skip_protocol | <code>Booelean</code> | If true protocol adapter will not be initialized |

<a name="_loadModel"></a>

## _loadModel() ⇒ <code>Fuction</code>
Creates a function that takes configurable options and queries the database for a single document. Alias for CoreController.db.default.load or CoreController.meta.load

**Kind**: global function  
**Returns**: <code>Fuction</code> - A function that queries the database for a single document  
<a name="_loadModel..fn"></a>

### _loadModel~fn(options, cb) ⇒ <code>Object</code>
Loads a single document from the database

**Kind**: inner method of <code>[_loadModel](#_loadModel)</code>  
**Returns**: <code>Object</code> - Returns a Promise which resolves with document if cb arugment is not passed  

| Param | Type | Description |
| --- | --- | --- |
| options | <code>Object</code> | Configurable options for load (see periodicjs.core.data for more details) |
| cb | <code>function</code> | Callback function |

<a name="_searchModel"></a>

## _searchModel() ⇒ <code>Fuction</code>
Creates a function that takes configurable options and queries the database for multiple documents. Alias for CoreController.db.default.search or CoreController.meta.search

**Kind**: global function  
**Returns**: <code>Fuction</code> - A function that queries the database for multiple documents  
<a name="_searchModel..fn"></a>

### _searchModel~fn(options, cb) ⇒ <code>Object</code>
Queries the database for multiple documents

**Kind**: inner method of <code>[_searchModel](#_searchModel)</code>  
**Returns**: <code>Object</code> - Returns a Promise which resolves with documents if cb arugment is not passed  

| Param | Type | Description |
| --- | --- | --- |
| options | <code>Object</code> | Configurable options for search (see periodicjs.core.data for more details) |
| cb | <code>function</code> | Callback function |

<a name="_createModel"></a>

## _createModel() ⇒ <code>Fuction</code>
Creates a function that takes configurable options and creates a document. Alias for CoreController.db.default.create or CoreController.meta.create

**Kind**: global function  
**Returns**: <code>Fuction</code> - A function that creates a document  
<a name="_createModel..fn"></a>

### _createModel~fn(options, cb) ⇒ <code>Object</code>
Creates a document in the database

**Kind**: inner method of <code>[_createModel](#_createModel)</code>  
**Returns**: <code>Object</code> - Returns a Promise which resolves with created document if cb arugment is not passed  

| Param | Type | Description |
| --- | --- | --- |
| options | <code>Object</code> | Configurable options for create (see periodicjs.core.data for more details) |
| cb | <code>function</code> | Callback function |

<a name="_updateModel"></a>

## _updateModel() ⇒ <code>Fuction</code>
Creates a function that takes configurable options and updates a document. Alias for CoreController.db.default.update or CoreController.meta.update

**Kind**: global function  
**Returns**: <code>Fuction</code> - A function that updates a document  
<a name="_updateModel..fn"></a>

### _updateModel~fn(options, cb) ⇒ <code>Object</code>
Updates a document in the database

**Kind**: inner method of <code>[_updateModel](#_updateModel)</code>  
**Returns**: <code>Object</code> - Returns a Promise which resolves with the update status if cb argument is not passed  

| Param | Type | Description |
| --- | --- | --- |
| options | <code>Object</code> | Configurable options for update (see periodicjs.core.data for more details) |
| cb | <code>function</code> | Callback function |

<a name="_deleteModel"></a>

## _deleteModel() ⇒ <code>Fuction</code>
Creates a function that takes configurable options and deletes a document. Alias for CoreController.db.default.delete or CoreController.meta.delete

**Kind**: global function  
**Returns**: <code>Fuction</code> - A function that deletes a document  
<a name="_deleteModel..fn"></a>

### _deleteModel~fn(options, cb) ⇒ <code>Object</code>
Deletes a document in the database

**Kind**: inner method of <code>[_deleteModel](#_deleteModel)</code>  
**Returns**: <code>Object</code> - Returns a Promise which resolves with the delete status if cb argument is not passed  

| Param | Type | Description |
| --- | --- | --- |
| options | <code>Object</code> | Configurable options for delete (see periodicjs.core.data for more details) |
| cb | <code>function</code> | Callback function |

<a name="_logError"></a>

## _logError() ⇒ <code>function</code>
Logs an error. Alias for CoreController.protocol.error or CoreController.meta.error

**Kind**: global function  
**Returns**: <code>function</code> - Returns a function which logs an error using the CoreController logger  
<a name="_logError..fn"></a>

### _logError~fn(options)
Logs an error

**Kind**: inner method of <code>[_logError](#_logError)</code>  

| Param | Type | Description |
| --- | --- | --- |
| options | <code>Object</code> | Configurable options for error logging |
| options.req | <code>Object</code> | Express request object |
| options.res | <code>Object</code> | Express response object |
| options.err | <code>Object</code> &#124; <code>string</code> | Error object or an error message |

<a name="_logWarning"></a>

## _logWarning() ⇒ <code>function</code>
Logs a warning. Alias for CoreController.protocol.warn or CoreController.meta.warn

**Kind**: global function  
**Returns**: <code>function</code> - Returns a function which logs warnings using CoreController logger  
<a name="_logWarning..fn"></a>

### _logWarning~fn(options)
Logs a warning

**Kind**: inner method of <code>[_logWarning](#_logWarning)</code>  

| Param | Type | Description |
| --- | --- | --- |
| options | <code>Object</code> | Configurable options for warning logging |
| options.req | <code>Object</code> | Express request object |
| options.res | <code>Object</code> | Express response object |
| options.err | <code>Object</code> &#124; <code>string</code> | Error object or an warning message |

<a name="_getPluginViewDefaultTemplate"></a>

## _getPluginViewDefaultTemplate() ⇒ <code>function</code>
Creates a function that will resolve a template file path from a set of directories. Alias for CoreController._utility_responder.render

**Kind**: global function  
**Returns**: <code>function</code> - A function that will resolve a valid file path for a template  
<a name="_getPluginViewDefaultTemplate..fn"></a>

### _getPluginViewDefaultTemplate~fn(opts, callback) ⇒ <code>Object</code>
Get a valid file path for a template file from a set of directories

**Kind**: inner method of <code>[_getPluginViewDefaultTemplate](#_getPluginViewDefaultTemplate)</code>  
**Returns**: <code>Object</code> - Returns a Promise which resolves with file path if cb argument is not passed  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| opts | <code>Object</code> |  | Configurable options (see periodicjs.core.protocols for more details) |
| [opts.extname] | <code>string</code> |  | Periodic extension that may contain view file |
| opts.viewname | <code>string</code> |  | Name of the template file |
| [opts.themefileext] | <code>string</code> | <code>&quot;\&quot;periodicjs.theme.default\&quot;&quot;</code> | Periodic theme that may contain view file |
| [opts.viewfileext] | <code>string</code> | <code>&quot;\&quot;.ejs\&quot;&quot;</code> | File extension type |
| callback | <code>function</code> |  | Callback function |

<a name="_respondInKind"></a>

## _respondInKind() ⇒ <code>function</code>
Creates a function that will send a HTTP response or return a formatted response object. Alias for CoreController.protocol.respond

**Kind**: global function  
**Returns**: <code>function</code> - A function that will format response data and send a response  
<a name="_respondInKind..fn"></a>

### _respondInKind~fn(opts, [callback]) ⇒ <code>function</code>
Sends response data to client or returns formatted response data

**Kind**: inner method of <code>[_respondInKind](#_respondInKind)</code>  
**Returns**: <code>function</code> - If callback is not defined optionally returns a Promise which will resolve response data  

| Param | Type | Description |
| --- | --- | --- |
| opts | <code>Object</code> | Configurable options (see periodicjs.core.protocols for more details) |
| opts.callback | <code>function</code> | An optional callback. If this options is defined callback argument will be ignored |
| opts.responseData | <code>\*</code> | Data to include in response object. If opts.err is defined this option will be ignored and the response will be treated as an error response |
| opts.err | <code>\*</code> | Error data. If this option is defined response will always be an error response unless .ignore_error is true |
| opts.req | <code>Object</code> | Express request object |
| opts.res | <code>Object</code> | Express response object |
| [callback] | <code>function</code> | Optional callback function |

<a name="_handleDocumentQueryRender"></a>

## _handleDocumentQueryRender() ⇒ <code>function</code>
Creates a function that will render a template and send HTTP response to client. Alias for CoreController._utility_responder.render

**Kind**: global function  
**Returns**: <code>function</code> - A function that will render a template and send data to client  
<a name="_handleDocumentQueryRender..fn"></a>

### _handleDocumentQueryRender~fn(opts, [callback]) ⇒ <code>function</code>
Renders a view from template and sends data to client

**Kind**: inner method of <code>[_handleDocumentQueryRender](#_handleDocumentQueryRender)</code>  
**Returns**: <code>function</code> - If callback is not defined returns a Promise which resolves with rendered template  

| Param | Type | Description |
| --- | --- | --- |
| opts | <code>Object</code> | Configurable options (see periodicjs.core.responder for more details) |
| opts.extname | <code>string</code> | Periodic extension which may have template in view folder |
| opts.viewname | <code>string</code> | Name of template file |
| opts.themefileext | <code>string</code> | Periodic theme which may have template in view folder |
| opts.viewfileext | <code>string</code> | The file extension of the view file |
| opts.req | <code>Object</code> | Express request object |
| opts.res | <code>Object</code> | Express response object |
| [callback] | <code>function</code> | Optional callback function |

<a name="_handleDocumentQueryErrorResponse"></a>

## _handleDocumentQueryErrorResponse() ⇒ <code>function</code>
Creates a function that will render an error view from a template. Alias for CoreController._utility_responder.error

**Kind**: global function  
**Returns**: <code>function</code> - A function that will render an error view from a template and send response  
<a name="_handleDocumentQueryErrorResponse..fn"></a>

### _handleDocumentQueryErrorResponse~fn(opts, [callback]) ⇒ <code>Object</code>
Renders an error view from a template and sends data to client

**Kind**: inner method of <code>[_handleDocumentQueryErrorResponse](#_handleDocumentQueryErrorResponse)</code>  
**Returns**: <code>Object</code> - If callback is not defined returns a Promise which resolves after response has been sent  

| Param | Type | Description |
| --- | --- | --- |
| opts | <code>Object</code> | Configurable options (see periodicjs.core.responder for more details) |
| opts.err | <code>string</code> &#124; <code>Object</code> | Error details for response |
| opts.req | <code>Object</code> | Express request object |
| opts.res | <code>Object</code> | Express response object |
| [callback] | <code>function</code> | Optional callback function |

<a name="_renderView"></a>

## _renderView() ⇒ <code>function</code>
Creates a function that will render data from a view put can accept additional data for the template and always send a response. Alias for CoreController.protocol.respond

**Kind**: global function  
**Returns**: <code>function</code> - A function that will render a view from a template given template data  
<a name="_renderView..fn"></a>

### _renderView~fn(req, res, viewtemplate, viewdata)
Renders a view from a template given template data

**Kind**: inner method of <code>[_renderView](#_renderView)</code>  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | Express request object |
| res | <code>Object</code> | Express response object |
| viewtemplate | <code>string</code> | File path for the view template. By default render will check if file exists in configured default theme and periodicjs extension as well as the viewname as an absolute path |
| viewdata | <code>Object</code> | Data that should be passed for template render |

<a name="_getViewModelProperties"></a>

## _getViewModelProperties() ⇒ <code>function</code>
Creates a function that will get inflected values from a given string

**Kind**: global function  
**Returns**: <code>function</code> - A function that will get inflected values from a given string  

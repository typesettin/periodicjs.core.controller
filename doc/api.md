<a name="Controller"></a>
#class: Controller
**Members**

* [class: Controller](#Controller)
  * [new Controller(resources)](#new_Controller)
  * [controller.getPluginViewDefaultTemplate(options, callback)](#Controller#getPluginViewDefaultTemplate)
  * [controller.handleDocumentQueryRender(options)](#Controller#handleDocumentQueryRender)
  * [controller.handleDocumentQueryErrorResponse(options)](#Controller#handleDocumentQueryErrorResponse)
  * [controller.loadModel(options)](#Controller#loadModel)
  * [controller.searchModel(options)](#Controller#searchModel)
  * [controller.createModel(options)](#Controller#createModel)
  * [controller.updateModel(options)](#Controller#updateModel)
  * [controller.deleteModel(options)](#Controller#deleteModel)

<a name="new_Controller"></a>
##new Controller(resources)
A core constructor that provides numerous controller helper functions.

**Params**

- resources `object` - variable injection from resources from instantiated periodic express app  

**Author**: Yaw Joseph Etse  
**License**: MIT  
**Copyright**: Copyright (c) 2014 Typesettin. All rights reserved.  
<a name="Controller#getPluginViewDefaultTemplate"></a>
##controller.getPluginViewDefaultTemplate(options, callback)
Gets the path to the view file specified, first look at custom theme views, then extension views, then default views

**Params**

- options `object` - extname, themename, themefileext - support custom theme files  
- callback `function` - async callback  

**Returns**: `function` - async callback(err,viewname)  
<a name="Controller#handleDocumentQueryRender"></a>
##controller.handleDocumentQueryRender(options)
default response handler for express views, or will redirect to another request

**Params**

- options `object` - res,req,redirecturl,err,callback,responseData - this is what's sent to the rendered template view, also appends http request information like base url, query string parameters, etc  

**Returns**: `object` - response object render or callback  
<a name="Controller#handleDocumentQueryErrorResponse"></a>
##controller.handleDocumentQueryErrorResponse(options)
default response handler for error, or will redirect with flash error set

**Params**

- options `object` - err,req,res,callback  

**Returns**: `object` - response object render or callback  
<a name="Controller#loadModel"></a>
##controller.loadModel(options)
short hand mongoose load document query

**Params**

- options `object` - model,docid - id or name,callback,population -mongoose population, selection - mongoose selection  

**Returns**: `function` - callback(err,document)  
<a name="Controller#searchModel"></a>
##controller.searchModel(options)
short hand mongoose search documents query

**Params**

- options `object` - model,query - mongoose query,callback,population -mongoose population, selection - mongoose selection , limit, offset  

**Returns**: `function` - callback(err,documents)  
<a name="Controller#createModel"></a>
##controller.createModel(options)
short hand mongoose create document query

**Params**

- options `object` - model,newdoc - document to insert, req, res,callback, successredirect, appendid - append the id of newly created document on redirect  

**Returns**: `object` - responseData or redirected page  
<a name="Controller#updateModel"></a>
##controller.updateModel(options)
short hand mongoose update document query

**Params**

- options `object` - model, id - objectid of mongoose document,updatedoc - document to update, req, res,callback, successredirect, appendid - append the id of newly created document on redirect, removefromarray - sets the update operation to manipulate an array of documents with mongo $pull, appendArray - sets the update operation to manipulate an array of documents with mongo $push, saverevision - save revisions  

**Returns**: `object` - responseData or redirected page  
<a name="Controller#deleteModel"></a>
##controller.deleteModel(options)
short hand mongoose delete document query

**Params**

- options `object` - model,deleteid - id to delete,callback  

**Returns**: `function` - callback(err)  

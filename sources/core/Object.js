/**
  Copyright (C) 2009-2012. David Thevenin, ViniSketch SARL (c), and
  contributors. All rights reserved

  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU Lesser General Public License as published
  by the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
  GNU Lesser General Public License for more details.

  You should have received a copy of the GNU Lesser General Public License
  along with this program. If not, see <http://www.gnu.org/licenses/>.
*/

/********************************************************************

*********************************************************************/
/**
 *  @class Object
 *  vs.core.Object is the root class of most class hierarchies. Through
 *  vs.core.Object, objects inherit a basic interface for configuration
 *  and clone mechanism. It provides an unique identifier for objects.
 *
 *  @author David Thevenin
 *
 *  @constructor
 *  Main constructor
 *
 * @name vs.core.Object
 *
 * @param {Object} config the configuration structure
*/
function VSObject (config)
{
  this.constructor = core.Object;
  if (util.isString (config)) { this._id = config; }
  else if (config && config.id) { this._id = config.id; }
  else this._id = createId ();
  
  this.__df__ = [];

  if (config)
  {
    this.__config__ = config;//util.clone (config);
  }
}

VSObject.prototype =
{
  /**
   * @protected
   * @String
   */
   _id: '',

  /**
   * @protected
   * @boolean
   */
   __i__: false,
   __input_property__did__change__: false, 

  /**
   * @protected
   * @object
   */
   __config__: null,
   __df__: null,

  /**
   *  Object default init. <p>
   *
   * @name vs.core.Object#init
   * @function
   *
   *  @example
   *  myObject = new vs.core.Object (vs.core.createId ());
   *  myObject.init ();
   *  @return {Object} this
   */
  init : function (fromClone)
  {
    if (this.__i__) { return this; }

    if (!this._id)
    {
      this._id = createId ();
    }
    
    if (VSObject._obs [this._id]) {
      console.warn ("Impossible to create an object with an already used id.");
      var old_id = this._id;
      this._id = createId ();
      console.warn ("The id \"%s\" is replaced by \"%s\".", old_id, this._id);
    }

    // save the current object
    VSObject._obs [this._id] = this;

    if (!fromClone) this.initComponent ();
    this.__i__ = true;

    // Call initialization code generated by ViniSketch Designer
    if (!fromClone && this.vsdInit) this.vsdInit ();

    if (this.__config__)
    {
      this.configure (this.__config__);
      this.__config__ = null;
//      delete (this.__config__);
    }

    // Call optional end initialization method
    if (this.componentDidInitialize) this.componentDidInitialize ();

    // legacy code for application using the initSkin mechanism
    // @deprecated
    if (this.initSkin)
    {
      console.warn ("Your application shouldn't use initSkin anymore.\n\
        You should rename by componentDidInitialize.");

      // create a fake initSkin (for super call)
      VSObject.prototype.initSkin = function () {};

      // call the initSkin
      this.initSkin ();

      // remove the fake initSkin
      VSObject.prototype.initSkin = undefined;
    }

    return this;
  },

  /**
   * @protected
   * @function
   */
  initComponent : function ()
  {},

  /**
   * @protected
   * @function
   */
  componentDidInitialize : function ()
  {},

  /**
   * @deprecated
   * @private
   */
  createId : function ()
  {
    console.warn
      ("this.createId is deprecated, Use the static method vs.core.createId instead");
    return createId ();
  },

  /**
   *  Object configuation method. <p>
   *  Call this method to adjust some properties of the internal components
   *  using one call. <br/>
   *  It takes as parameters, an associated array <propertyName, value>.
   *  <br/><br/>
   *  Ex:
   *  @example
   *  var myObject = new vs.core.Object ({id: 'myobject'});
   *  myObject.init ();
   *
   *  myObject.configure ({prop1: "1", prop2: 'hello', ..});
   *  <=>
   *  myObject.prop1 = "1";
   *  myObject.prop2 = "hello";
   *  ...
   *
   * @name vs.core.Object#configure
   * @function
   *
   * @param {Object} config the associated array used for configuring the
   *        object.
   */
  configure : function (config)
  {
    if (typeof (config) !== 'object') { return; }
    var props, key, i, should_propagate = false, desc;

    if (this.__df__) 
      this.__df__.forEach (function (df) {
        df.pausePropagation ();
      });

    // Manage model
    if (config instanceof Model)
    {
      desc = this.getPropertyDescriptor ('model');
      if (desc && desc.set)
      {
        // model property assignation
        this.model = config;
        should_propagate = true;
      }
      else
      {
        // one by one property copy
        props = config.getModelProperties ();
        for (i = 0; i < props.length; i++)
        {
          key = props [i];
          if (key === 'id') { continue; }
          this [key] = config [key];
          should_propagate = true;
        }
      }
    }
    else
    {
      if (config) for (key in config)
      {
        if (key === 'id' || key === 'node' ||
            key === 'node_ref' || key === 'view')
        { continue; }
        this [key] = config [key];
        should_propagate = true;
      }
    }

    if (this.__df__ && this.__df__.length) {
      this.__df__.forEach (function (df) {
        df.restartPropagation ();
        if (should_propagate) {
          df.propagate (this);
        }
      });
    }
    else if (should_propagate && this.propertiesDidChange) {
      this.propertiesDidChange ();
    }
  },
  
  /**
   *  This method is called by the dataflow algorithm when input properties have
   *  been changed.
   *  You should reimplement this method if you want make specific calculation
   *  on properties changed, and/or modifying output properties.
   *  If you have modifying an output property (and want to continue the
   *  dataflow propagation) you have to return 'false' or nothing.
   *  Otherwise return 'true' to and the propagation will terminate.
   *
   * @name vs.core.Object#propertiesDidChange
   * @function
   * @return {boolean} true if you wants stop de propagation, false otherwise
   */
  propertiesDidChange: function () { return false; },

  /**
   *  Returns a copy of the objet's properties for JSON stringification.<p/>
   *  This can be used for persistence or serialization.
   *
   * @name vs.core.Object#toJSON
   * @function
   * @return {Object} the object value for stringify
   */
  toJSON : function ()
  {
    return this._toJSON ();
  },

  /**
   *  Set objet's properties from JSON stringification.<p/>
   *  This can be used when retrieve data from serialization.
   *
   * @name vs.core.Object#parseJSON
   * @function
   * @param {String} json The JSON String
   */
  parseJSON : function (json)
  {
    try {
      this.parseData ((json && util.parseJSON (json)) || {});
    }
    catch (e)
    {
      if (e.stack) console.log (e.stack)
      console.error ("vs.core.Object.parseJSON failed. " + e.toString ());
    }
  },

  /**
   * @protected
   */
  parseData : function (obj)
  {
    var key, value, result;
    for (key in obj)
    {
      value = obj [key];
//         if (util.isString (value))
//         {
//           result = util.__date_reg_exp.exec (value);
//           if (result && result [1]) // JSON Date -> Date generation
//           {
//             this ['_' + key] = new Date (parseInt (result [1]));
//           }
//           else this ['_' + key] = value; // String
//         }
      this ['_' + util.underscore (key)] = value;
    }
  },

  /**
   *  Returns a copy of the objet's properties for JSON stringification.<p/>
   *  This can be used for persistence or serialization.
   * @private
   * @name vs.core.Object#_toJSON
   * @function
   */
  _toJSON : function (json)
  {
    var prop_name, value, data = {}, result,
      _properties_ = this.getModelProperties (), n = 0;

    if (!_properties_) return data;

    for (var i = 0; i < _properties_.length; i++)
    {
      prop_name = _properties_ [i];
      value = this ['_' + util.underscore (prop_name)];
      if (typeof value == "undefined") continue;
      else if (value instanceof Date)
      { result = '"\/Date(' + value.getTime () + ')\/"'; }
      else if (value && value.toJSON) { result = value.toJSON (); }
      else result = value;
      data [prop_name] = result;
    }

    return data;
  },

  /**
   * @protected
   * @function
   */
  destructor : function ()
  {
    // remove the current object
    delete (VSObject._obs [this._id]);
    
    this.__i__ = false;
  },

  /**
   * @public
   * @function
   */
  isDeleted : function ()
  {
    return !this.__i__;
  },

  /**
   * Manually force properties change propagation.
   * <br/>
   * If no property name is specified, the system will assume all component's
   * properties have been modified.
   *
   * @name vs.core.Object#propertyChange
   * @function
   *
   * @param {String} property the name of the modified property.[optional]
   */
  propertyChange : function (property)
  {
    this.__input_property__did__change__ = true, self = this;
    if (this.__df__) 
      this.__df__.forEach (function (df) {
        df.propagate (self);
      });
  },


  /**
   * Manually force out properties change propagation.
   * <br/>
   * If no property name is specified, the system will assume all component's
   * properties have been modified.
   *
   * @name vs.core.Object#outPropertyChange
   * @function
   *
   * @param {String} property the name of the modified property.[optional]
   */
  outPropertyChange : function (property)
  {
    this.__input_property__did__change__ = true, self = this;
    if (this.__df__) 
      this.__df__.forEach (function (df) {
        df.propagate (self, false, true);
      });
  },
  
  /**
   * Manually force properties change propagation.
   * <br/>
   * @deprecated
   * @name vs.core.Object#propagateChange
   * @see vs.core.Object#propertyChange
   * @param {String} property the name of the modified property.[optional]
   * @param {Object} data.[optional]
   */
  propagateChange : function (property)
  {
    this.propertyChange (property);
  },

  /**
   * Connect two components within the datalfow.
   * This method return a Connector that will allow you to declare your
   * dataflow with a simple chaining API.
   *
   * @example
   * /// First example: the slide will rotate the view1 and view2
   * var slider = new vs.ui.Slider ({}).init ();
   * var view1 = new vs.ui.View ({}).init ();
   * var view2 = new vs.ui.View ({}).init ();
   * 
   * slider
   *   .connect ("value") // out property
   *   .to (view1, "rotation"); // in property
   *   .to (view2, "rotation"); // in property
   *
   * /// Seconde example: the slide will rotate the view1 and view2
   * var slider = new vs.ui.Slider ({range: [1, 10]}).init ();
   * var list = new vs.core.Array({data: ["item1", ..., "item10"]}).init ();
   * var label = new vs.ui.TextLabel ({}).init ();
   * 
   * slider
   *   .connect ("value") // out property
   *   .to (list, "index") // in property
   *     .connect ("value") // in property
   *     .to (label, "text"); // in property
   *
   *
   * @name vs.core.Object#connect 
   * @function
   * @public
   * @param {String} property_name the Component out property name to connect
   *                 from
   */
  connect : function (property_out) {
    return new Connector (this, property_name);
  },

  /**
   * The method allows to link a model to an other object (a view for
   * instance).<br />
   * This is a simple way to create a MVC architecture; each model
   * modification will be propagated to the view.<br/><br/>
   * Linking is quite different than dataflow.<br/>
   * You can use linking to connect 2 objects with the same properties name.
   * <br/>
   * With dataflow its possible to connect a set of object, and define precisely
   * witch properties are connected together.<br/>
   * <br/>
   * Please notice that dataflow propagation is more optimized than linking
   * propagation.
   *
   * @example
   *  var myModel = new MyModel ().init ();
   *  var myView = new MyView ().init ();
   *
   *  myView.link (myModel);
   *
   *  myModel.prop = "value"; // the myView.prop will be automatically updated.
   *  ...
   *  myModel.stopPropagation ();
   *  myModel.prop = "value";
   *  myModel.propBis = "valueBis";
   *  myModel.change (); // the view is updated
   *
   * @name vs.core.Object#link
   * @function
   * @param {vs.core.Model} model The model to link with
   */
  link : function (model)
  {
    // model update management
    if (model instanceof vs.core.Model)
    {
      if (this.__model) this.__model.unlinkTo (this);
      this.__model = model;
      this.__model.linkTo (this);

      // first configuration
      this.configure (this.__model)
    }
    else throw "vs.core.Object.link; parameter is not a vs.core.Model";
  },

  /**
   * Unlink the model which was linked with this object
   * @see vs.core.Object#link
   *
   * @name vs.core.Object#unlink
   * @function
   */
  unlink : function ()
  {
    // model update management
    if (this.__model)
    {
      if (this.__model)
      {
        this.__model.unlinkTo (this);
        var props = this.__model.getModelProperties (); l = props.length,
          config = {};
        while (l--) { config [props[l]] = null; }
        this.configure (config);
      }
      this.__model = undefined;
    }
  },

  /**
   *  Clone the Object <p>
   *
   * @name vs.core.Object#clone
   * @function
   *
   * @param {Object} config the configuration structure for the new object
   * @return {vs.core.Object} the cloned object
   */
  clone : function (config, cloned_map)
  {
    var obj, key, value, desc, desc_clone, getter, setter;

    if (!cloned_map) { cloned_map = {}; }

    // have already cloned;
    if (cloned_map [this._id]) { return cloned_map [this._id]; }

    if (!config) { config = {}; }
    if (!config.id) { config.id = createId (); }

    if (util.isFunction (this.constructor))
    {
      obj = new this.constructor (config);
    }
    else
    {
      console.warn ("impossible to clone this object.");
      return null
    }

    cloned_map [this._id] = obj;

    function _propertyDecl_api1 (prop_name, src, trg)
    {
      var getter = src.__lookupGetter__ (prop_name),
        setter = src.__lookupSetter__ (prop_name),
        getter_clone = trg.__lookupGetter__ (prop_name),
        setter_clone = trg.__lookupSetter__ (prop_name);

      // manage getter
      if (getter && !getter_clone)
      {
        trg.__defineGetter__ (prop_name, getter);
      }
      // manage setter
      if (setter && !setter_clone)
      {
        trg.__defineSetter__ (prop_name, setter);
      }
      // generic member copy
      if (!setter && !getter)
      {
        var value = src [prop_name];
        if (util.isArray (value)) { trg [prop_name] = value.slice (); }
        else { trg [prop_name] = src [prop_name]; }
      }
      else {
        if (!trg.__properties__) trg.__properties__ = [];
        trg.__properties__.push (prop_name);
      }
    }

    function _propertyDecl_api2 (prop_name, src, trg)
    {
      var desc = src.getOwnPropertyDescriptor (prop_name),
        desc_clone = trg.getOwnPropertyDescriptor (prop_name);

      // manage getter and setter
      if (desc && (desc.get || desc.set))
      {
        // the property description doesn't exist. Create it.
        if (!desc_clone) {
          util.defineProperty (trg, prop_name, desc);
          if (!trg.__properties__) trg.__properties__ = [];
          trg.__properties__.push (prop_name);
        }
      }
      // generic member copy
      else
      {
        var value = src [prop_name];
        if (util.isArray (value)) { trg [prop_name] = value.slice (); }
        else { trg [prop_name] = src [prop_name]; }
      }
    }

    var propertyDecl =
      (Object.defineProperty)?_propertyDecl_api2:_propertyDecl_api1;

    // property and function declaration copy
    for (key in this)
    {
      // do not manage id or private member
      if (key === 'parent' || key === '_id' || key === 'constructor' ||
          key.indexOf ('__') === 0) continue;  
      if (!this.getPropertyDescriptor (key)) continue;

      // function copy
      if (util.isFunction (this [key]) && !util.isFunction (obj [key]))
      { obj [key] = this [key]; }
      
      // property descriptor copy
      else if (!obj.isProperty (key) && this.isProperty (key))
      { propertyDecl (key, this, obj); }
    }

    obj.__i__ = false;
    obj.init ();

    // call object specific clone implementation
    this._clone (obj, cloned_map);

    // property values copy
    this._clone_properties_value (obj, cloned_map);

    // manage linking clone
    if (this.__model)
    {
      if (cloned_map && cloned_map [this.__model._id])
      { obj.link (cloned_map [this.__model._id]); }
      else { obj.link (this.__model); }
    }

    return obj;
  },
  
   /**
   * @name vs.core.Object#_clone_properties_value
   * @function
   * @protected
   *
   * @param {vs.core.Object} obj The cloned object
   * @param {Object} map Map of cloned objects
   */
  _clone_properties_value : function (obj, cloned_map)
  {
    var key;
    
    for (key in this)
    {
      if (key == 'id') continue;

      // property value copy
      if (this.isProperty (key)) { propertyCloneValue (key, this, obj); }
    }
  },

  /**
   * @name vs.core.Object#_clone
   * @function
   * @private
   *
   * @param {vs.core.Object} obj The cloned object
   * @param {Object} map Map of cloned objects
   */
  _clone : function (obj, cloned_map)
  {},

  /*************************************************************
                  Properties introscpection
  *************************************************************/

  /**
   *  Returns the list of object's properties name <p>
   *
   * @name vs.core.Object#getModelProperties
   * @function
   * @return {Array} Array of name of properties
   */
  getModelProperties : function ()
  {
    var result = [];
    if (this.__properties__) result = result.concat (this.__properties__);
    if (this.constructor.__properties__)
      result = result.concat (this.constructor.__properties__)

    return result;
  },

  /**
   *  Returns true if this component has a property with this name
   *
   * @name vs.core.Object#isProperty
   * @function
   * @return {boolean} true or false
   */
  isProperty : function (name)
  {
    if (this.__properties__ && this.__properties__.indexOf (name) !== -1) return true;
    if (this.constructor.__properties__.indexOf (name) !== -1) return true;

    return false;
  },
  
  /**
   * Defines a new property directly on an object
   * @name vs.core.Object#defineProperty
   *
   * @param {String} prop_name The name of the property to be defined
   * @param {Object} descriptor The descriptor for the property being defined
   */
  defineProperty : function (prop_name, descriptor)
  {
    util.defineProperty (this, prop_name, descriptor);
    if (!this.__properties__) this.__properties__ = [];
    if (this.__properties__.indexOf (prop_name) === -1)
    { this.__properties__.push (prop_name); }
  },

  /**
   * Returns a property descriptor for an own property (that is, one directly
   * present on an object, not present by dint of being along an object's
   * prototype chain) of a given object.
   * @name vs.core.Object#getOwnPropertyDescriptor
   *
   * @param {String} prop The name of the property whose description is to
   *   be retrieved
   * @return {Object} The property descriptor or null
   */
  getOwnPropertyDescriptor : function (prop)
  {
    return Object.getOwnPropertyDescriptor (this, prop);
  },

  /**
   * Returns a property descriptor for a property (along the object's
   * prototype chain) of a given object.
   * @name vs.core.Object#getPropertyDescriptor
   *
   * @param {String} prop The name of the property whose description is to
   *   be retrieved
   * @return {Object} The property descriptor or null
   */
  getPropertyDescriptor : function (prop)
  {
    var desc = Object.getOwnPropertyDescriptor (this, prop);
    if (desc) return desc;

    /** @private */
    function _getOwnPropertyDescriptor (obj, prop)
    {
      if (!obj) return null;
      var proto = Object.getPrototypeOf (obj);
      if (!proto) return null;
      var desc = Object.getOwnPropertyDescriptor (proto, prop);
      if (desc) return desc;
      return _getOwnPropertyDescriptor (proto, prop);
    }

    return _getOwnPropertyDescriptor (this, prop);
  },

  /**
   * @private
   */
  _super : function ()
  {
    var superFunc = this._super.caller._super_func_;
    if (superFunc) superFunc.apply (this, arguments);
  },
};

/********************************************************************
                  Define class properties
********************************************************************/

util.defineClassProperty (VSObject, "id", {
  /**
   * Getter for vs.core.Object id
   * @name vs.core.Object#id
   *
   * @type {String}
   */
  get : function () { return this._id; }
});

/**
 * @private
 */
function _cloneValue (value)
{
  if (value && util.isFunction (value.clone)) return value.clone ();
  else return util.clone (value);
}

/**
 * @private
 */
function _propertyCloneValue_api1 (prop_name, src, trg)
{
  var getter = src.__lookupGetter__ (prop_name),
    setter = src.__lookupSetter__ (prop_name),
    setter_clone = trg.__lookupSetter__ (prop_name),
    _prop_name = '_' + util.underscore (prop_name);

  // Property value copy
  if (setter || getter)
  {
    if (setter_clone) { trg [prop_name] = _cloneValue (src [_prop_name]); }
    else { trg [_prop_name] = _cloneValue (src [_prop_name]); }
  }
}

/**
 * @private
 */
function _propertyCloneValue_api2 (prop_name, src, trg)
{
  var desc = src.getPropertyDescriptor (prop_name),
    desc_clone = trg.getPropertyDescriptor (prop_name),
    _prop_name = '_' + util.underscore (prop_name);
  
  // Property value copy
  if (desc && desc_clone && (desc.get || desc.set))
  {
    if (desc_clone.set) { trg [prop_name] = _cloneValue (src [_prop_name]); }
    else { trg [_prop_name] = _cloneValue (src [_prop_name]); }
  }
}

/**
 * @private
 */
var propertyCloneValue =
  (Object.defineProperty)?_propertyCloneValue_api2:_propertyCloneValue_api1;

/********************************************************************
                      Static members
*********************************************************************/
/** @private */
VSObject._obs = {};
VSObject.__propertyCloneValue = propertyCloneValue;

/********************************************************************
                      Export
*********************************************************************/
/** @private */
core.Object = VSObject;

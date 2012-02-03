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

  if (config)
  {
    this.__config__ = util.clone (config);
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

  /**
   * @protected
   * @object
   */
   __config__: null,

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
  init : function ()
  {
    if (this.__i__) { return this; }

    if (!this._id)
    {
      this._id = createId ();
    }
    
    // save the current object
    VSObject._obs [this._id] = this;

    this.initComponent ();
    this.__i__ = true;

    if (this.__config__)
    {
      this.configure (this.__config__);
      delete (this.__config__);
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
    
    var df = _df_node_to_def [this._id];
    if (df) df.pausePropagation ();

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
        props = config.getProperties ();
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
            key === 'nodeRef' || key === 'view') 
        { continue; }
        this [key] = config [key];
        should_propagate = true;
      }
    }
    
    if (df)
    {
      df.restartPropagation ();
      if (should_propagate)
      {
        if (this.propertiesDidChange) this.propertiesDidChange ();
        df.propagate (this._id);
      }
    }
    else if (should_propagate && this.propertiesDidChange) 
    { this.propertiesDidChange (); }
  },

  /**
   *  Returns the list of object's properties name <p>
   *
   * @name vs.core.Object#getProperties
   * @function
   * @return {Array} Array of name of properties
   */
  getProperties : function ()
  {
    if (!this.constructor._properties_) return [];
    
    return this.constructor._properties_.slice ();
  },
    
  /**
   *  Returns a copy of the objet's properties for JSON stringification.<p/>
   *  This can be used for persistence or serialization.
   *
   * @name vs.core.Object#toJSON
   * @function
   * @return {String} The JSON String
   */
  toJSON : function ()
  {
    return this._toJSON ("{") + "}";
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
      var obj = (json && util.parseJSON (json)) || {}, value, result;
  
      for (var key in obj)
      {
//         value = obj [key];
//         if (util.isString (value))
//         {
//           result = util.__date_reg_exp.exec (value);
//           if (result && result [1]) // JSON Date -> Date generation
//           {
//             this ['_' + key] = new Date (parseInt (result [1]));
//           }
//           else this ['_' + key] = value; // String
//         }
        this ['_' + key] = value;
      }
    }
    catch (e)
    {
      console.error ("vs.core.Object.parseJSON failed. " + e.toString ());
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
    var prop_name, value, str,
      _properties_ = this.constructor._properties_, n = 0;

    if (!_properties_) return json;
    
    for (var i = 0; i < _properties_.length; i++)
    {
      prop_name = _properties_ [i];
      value = this ['_' + prop_name];
      if (typeof value == "undefined") continue;
      else if (value == null) str = 'null';
      else if (value instanceof Date)
      { str = '"\/Date(' + value.getTime () + ')\/"'; }
      else
      {
        if (value.toJSON) { str = value.toJSON (); }
        else try {
          str = JSON.stringify (value);
        } catch (e)
        { 
          console.warn (e);
          continue;
        }
      }
      if (n++) json += ',';
      json += "\"" + prop_name + "\":" + str;
    }
        
    return json;
  },
    
  /**
   * @protected
   * @function
   */
  destructor : function ()
  {},
  
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
    var df = _df_node_to_def [this._id];
    if (!df)
    {
      return;
    }
    
    df.propagate (this._id, property);
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
    if (cloned_map [this]) { return cloned_map [this]; }

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
    
    cloned_map [this] = obj;
    
    for (key in this)
    {
      if (key == 'id' || key == '_id') continue;
      
      value = this [key];
      desc = Object.getOwnPropertyDescriptor (this, key);
      desc_clone = Object.getOwnPropertyDescriptor (obj, key);
      
      // manage getter and setter
      if (desc && (desc.get || desc.set))
      {
        // the property description doesn't exist. Create it.
        if (!desc_clone) { util.defineProperty (obj, key, desc); }
      }
      
      // manage other object members
      else if (this.hasOwnProperty (key))
      {
        if (value instanceof vs.core.Object)
        {
          obj [key] = value.clone (null, cloned_map);
        }
        else if (util.isArray (value))
        {
          obj [key] = value.slice ();
        }
        else { obj [key] = value; }
      }
    }
    
    obj.__i__ = false;
    return obj;
  },

  /*************************************************************
                  Properties introscpection
  *************************************************************/

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
    var proto = Object.getPrototypeOf (this);
    if (!proto) return null;
    return Object.getOwnPropertyDescriptor (proto, prop);
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

/********************************************************************
                      Static members
*********************************************************************/
/** @private */
VSObject._obs = {};

/********************************************************************
                      Export
*********************************************************************/
/** @private */
core.Object = VSObject;

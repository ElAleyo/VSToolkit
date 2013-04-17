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

/**
 *  @class
 *  vs.core.EventSource is an  class that forms the basis of event and command
 *  processing. All class that handles events must inherit form EventSource.
 *
 *  @extends vs.core.Object
 *  @author David Thevenin
 *
 *  @constructor
 *  Main constructor
 *
 * @name vs.core.EventSource
 *
 * @param {Object} config the configuration structure [mandatory]
 */
function EventSource (config)
{
  this.parent = core.Object;
  this.parent (config);
  this.constructor = core.EventSource;

  this.__bindings__ = {};
  this.__node_binds__ = {};
}

/** @name vs.core.EventSource# */
EventSource.prototype =
{
  /**
   * @protected
   * @function
   */
  __bindings__ : null,

  /**
   * @protected
   * @function
   */
  __node_binds__: null,

  /***************************************************************

  ***************************************************************/

  /**
   * @protected
   * @function
   */
  destructor : function ()
  {
    var spec, handler_list, i, handler, binds;

    function deleteBindings (handler_list)
    {
      if (!handler_list) return;

      var bind, l = handler_list.length;
      while (l--)
      {
        bind = handler_list [l];
        util.free (bind);
      }
    };

    for (var spec in this.__bindings__)
    {
      deleteBindings (this.__bindings__ [spec]);
      delete (this.__bindings__ [spec]);
    }

    delete (this.__bindings__);

    for (spec in this.__node_binds__)
    {
      binds = this.__node_binds__ [spec];
      if (typeof (binds) === "undefined")
      {
        console.warn
          ("vs.core.Object.destructor, no bind <" + spec + " exists.");
        continue;
      }
      for (i = 0; i < binds.length; i++)
      {
        data = binds [i];
        data.n.removeEventListener (event, data.h);
      }
    }
    delete (this.__node_binds__);

    VSObject.prototype.destructor.call (this);
  },

  /**
   * @name vs.core.EventSource#_clone
   * @function
   * @private
   *
   * @param {vs.core.Object} obj The cloned object
   * @param {Object} map Map of cloned objects
   */
  _clone : function (obj, cloned_map)
  {
    VSObject.prototype._clone.call (this, obj, cloned_map);

    obj.__bindings__ = {};
    obj.__node_binds__ = {};
  },

  /**
   *  The event bind method to listen events
   *  <p>
   *  When you want listen an event generated by this object, you can
   *  bind your object (the observer) to this object using 'bind' method.
   *  <p>
   *
   * @name vs.core.EventSource#bind
   * @function
   *
   * @param {string} spec the event specification [mandatory]
   * @param {vs.core.Object} obj the object interested to catch the event [mandatory]
   * @param {string} func the name of a callback. If its not defined
   *        notify method will be called [optional]
   */
  bind : function (spec, obj, func)
  {
    if (!spec || !obj) { return; }

    /** @private */
    var handler = new Handler (obj, func),
      handler_list = this.__bindings__ [spec];
    if (!handler_list)
    {
      handler_list = [];
      this.__bindings__ [spec] = handler_list;
    }
    handler_list.push (handler);

    return handler;
  },

  /**
   *  The event unbind method
   *  <p>
   *  Should be call when you want stop event listening on this object
   *
   * @name vs.core.EventSource#unbind
   * @function
   *
   * @param {string} spec the event specification [mandatory]
   * @param {vs.core.Object} obj the object you want unbind [mandatory]
   * @param {string} func the name of a callback. If its not defined
   *        all binding with <spec, obj> will be removed
   */
  unbind : function (spec, obj, func)
  {
    function unbind (handler_list)
    {
      if (!handler_list) return;

      var handler, i = 0;
      while (i < handler_list.length)
      {
        handler = handler_list [i];
        if (handler.obj === obj)
        {
          if (util.isString (func) || util.isFunction (func) )
          {
            if (handler.func_name === func || handler.func_ptr === func)
            {
              handler_list.remove (i);
              util.free (handler);
            }
            else { i++; }
          }
          else
          {
            handler_list.remove (i);
            util.free (handler);
          }
        }
      }
    };

    unbind (this.__bindings__ [spec]);
  },

  /**
   *  Propagate an event
   *  <p>
   *  All Object listening this EventSource will receive this new handled
   *  event.
   *
   * @name vs.core.EventSource#propagate
   * @function
   *
   * @param {String} spec the event specification [mandatory]
   * @param {Object} data an optional data event [optional]
   * @param {vs.core.Object} srcTarget a event source, By default this object
   *        is the event source [mandatory]
   */
  propagate : function (type, data, srcTarget)
  {
    var handler_list = this.__bindings__ [type], event;
    if (!handler_list || handler_list.length === 0)
    {
      if (this.__parent)
      {
        if (!srcTarget) { srcTarget = this; }
        this.__parent.propagate (type, data, srcTarget);
      }
      return;
    }

    event = new Event (this, type, data);
    if (srcTarget) { event.srcTarget = srcTarget; }

    queueProcAsyncEvent (event, handler_list);
  },

  /**
   * if this object receive an event it repropagates it if nobody has
   * overcharged the notify method.
   *
   * @name vs.core.EventSource#notify
   * @function
   *
   * @protected
   */
  notify : function (event)
  {
    this.propagate (event.type, event.data);
  },

  /**
   *  The event bind method to listen events form DOM
   *  <p>
   *  When you want you object listen an event generated by the DOM, you can
   *  bind your object (the observer) to the node using 'nodeBind' method.
   *
   * @name vs.core.EventSource#nodeBind
   * @function
   *
   * @param {Node} node the node to observe [mandatory]
   * @param {string} spec the event specification [mandatory]
   * @param {string|Function} func the name of a callback or the callback
   *      itself. If its not defined notify method will be called [optional]
   */
  nodeBind : function (node, event, func_s, modifiers)
  {
    if (!node) { return; }
    if (!util.isString (event)) { return; }

    var self = this, func = null, handler = null, binds, key;

    if (typeof (func_s) === "undefined") { func_s = 'notify'; }
    else if (util.isString (func_s))
    {
      if (!util.isFunction (this [func_s]))
      {
        console.warn
          ("vs.core.Object.nodeBind, unknown function named: " + func_s);
        return;
      }
    }
    else if (!util.isFunction (func_s))
    {
      console.error ("vs.core.Object.nodeBind, invalid func parameter");
      return;
    }
    else
    {
      func = func_s;
      func_s = func.name;
    }

    if (!modifiers || modifiers === KEYBOARD.ANY_MASK)
    {
      /**
       * @private
       */
      handler = function (event)
      {
        // event.preventDefault ();
        // event.stopPropagation (); // Seems this line of code bug with BB OS

        try
        {
          event.src = event.currentTarget;
          event.data = event;

          if (!func) { func = self [func_s]; }
          func.call (self, event);
        }
        catch (e)
        {
          console.error (e);
        }
      };
    }
    else
    {
      handler = function (event)
      {
        // event.preventDefault ();
        // event.stopPropagation ();

        try
        {
          if (!modifiers &&
            (event.altKey || event.ctrlKey || event.shiftKey || event.metaKey))
          { return; }
          else if (modifiers === KEYBOARD.ALT && !event.altKey)
          { return; }
          else if (modifiers === KEYBOARD.CTRL && !event.ctrlKey)
          { return; }
          else if (modifiers === KEYBOARD.SHIFT && !event.shiftKey)
          { return; }
          else if (modifiers === KEYBOARD.META && !event.metaKey)
          { return; }
          event.src = event.currentTarget;
          event.data = event;

          if (!func) { func = self [func_s]; }
          func.call (self, event);
        }
        catch (e)
        {
          console.error (e);
        }
      };
    }

    // save data for nodeUnbind
    key = event + func_s;
    if (!this.__node_binds__)
    {
      console.error ('nodeBind impossible');
      return;
    }
    binds = this.__node_binds__ [key];
    if (typeof (binds) === "undefined")
    {
      binds = [];
      this.__node_binds__ [key] = binds;
    }
    binds.push ({n: node, h: handler});

    // set the listener
    vs.addPointerListener (node, event, handler, false);
  },

  /**
   *  Unbind a DOM event listening
   *  <p>
   *
   * @name vs.core.EventSource#nodeUnbind
   * @function
   *
   * @param {Node} node the node which is observed [mandatory]
   * @param {string} spec the event specification [mandatory]
   * @param {string} func the name of a callback. If its not defined
   *        notify method will be called [optional]
   */
  nodeUnbind : function (node, event, func_s)
  {
    if (!node) { return; }
    if (!util.isString (event)) { return; }

    var func = null, i, key, binds, data;
    if (typeof (func_s) === "undefined") { func_s = 'notify'; }
    else if (util.isString (func_s))
    {
      if (!util.isFunction (this [func_s]))
      {
        console.warn ("vs.core.Object.nodeUnbind, unknown function named: " + func_s);
        return;
      }
    }
    else if (!util.isFunction (func_s))
    {
      console.error ("vs.core.Object.nodeBind, invalid func parameter");
      return;
    }
    else
    {
      func = func_s;
      func_s = func.name;
    }

    key = event + func_s;
    binds = this.__node_binds__ [key];
    if (typeof (binds) === "undefined")
    {
      console.warn
        ("vs.core.Object.nodeUnbind, no bind <" + event + ',' + func_s + "> exists.");
      return;
    }
    for (i = 0; i < binds.length;)
    {
      data = binds [i];
      if (data.n === node)
      {
        node.removeEventListener (event, data.h);
        binds.remove (i);
      }
      else
      {
        i++;
      }
    }

    // TODO WARNING pas bon, si plusieurs objets l'observe !!!
    node._object_ = undefined;
  },
//
//   /**
//    *  Should be documented
//    *
//    * @name vs.core.EventSource#allDocumentBind
//    * @function
//    *
//    */
//   allDocumentBind : function (event, func)
//   {
//     this._allDocumentBind (document, event, func);
//   },
//
//   /**
//    * @private
//    * @function
//    */
//   _allDocumentBind : function (doc, event, func)
//   {
//     if (!doc) { return; }
//
//     // current document event management
//     this.nodeBind (doc, event, func);
//
//     // children document event management
//     var frame, iframes, i;
//     if (doc.frames)
//     {
//       for (i = 0; i < doc.frames.length; i++)
//       {
//         frame = doc.frames [i];
//         this._allDocumentBind (frame.contentDocument, event, func);
//       }
//     }
//     iframes = doc.getElementsByTagName ('iframe');
//     if (iframes)
//     {
//       for (i = 0; i < iframes.length; i++)
//       {
//         frame = iframes.item (i);
//         this._allDocumentBind (frame.contentDocument, event, func);
//       }
//     }
//   },
//
//   /**
//    *  Should be documented
//    *
//    * @name vs.core.EventSource#allDocumentUnbind
//    * @function
//    *
//    */
//   allDocumentUnbind : function (event, func)
//   {
//     this._allDocumentUnbind (document, event, func);
//   },
//
//   /**
//    * @private
//    * @function
//    */
//   _allDocumentUnbind : function (doc, event, func)
//   {
//     if (!doc) { return; }
//
//     // current document event management
//     this.nodeUnbind (doc, event, func);
//
//     // children document event management
//     var frame, iframes, i;
//     if (doc.frames)
//     {
//       for (i = 0; i < doc.frames.length; i++)
//       {
//         frame = doc.frames [i];
//         this._allDocumentUnbind (frame.contentDocument, event, func);
//       }
//     }
//     iframes = doc.getElementsByTagName ('iframe');
//     if (iframes)
//     {
//       for (i = 0; i < iframes.length; i++)
//       {
//         frame = iframes.item (i);
//         this._allDocumentUnbind (frame.contentDocument, event, func);
//       }
//     }
//   }
};
util.extendClass (EventSource, VSObject);

/********************************************************************
                      Export
*********************************************************************/
/** @private */
core.EventSource = EventSource;


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
 *  The AjaxJSONP class
 *
 * @extends vs.core.EventSource
 * @name vs.core.AjaxJSONP
 * @events jsonload, loaderror
 * @class
 * It provides scripted client functionality for transferring data between
 * a client and a server.
 *
 *  @constructor
 *   Creates a new AjaxJSONP.
 *
 *  <p>
 *  Events:
 *  <ul>
 *    <li/> jsonload: data [Object]: propagate when data are loaded
 *    <li/> loaderror: data [error information]: propagate when an error occured
 *  </ul>
 *  <p>
 * @example
 *  var xhr = new vs.core.AjaxJSONP ({url: "http..."});
 *  xhr.init ();
 *  xhr.bind ('xmlload', this, this.processRSS);
 *  xhr.send ();
 *
 * @param {Object} config the configuration structure
 */
AjaxJSONP = function (config)
{
  this.parent = core.EventSource;
  this.parent (config);
  this.constructor = AjaxJSONP;
};

AjaxJSONP.prototype = {

 /*********************************************************
 *                  private data
 *********************************************************/

  /**
   *
   * @protected
   * @type {string}
   */
  _url: '',

  /**
   *
   * @private
   * @type {number}
   */
  __index: 0,

 /*********************************************************
 *                   management
 *********************************************************/

  /**
   *
   * @name vs.core.AjaxJSONP#send
   * @function
   *
   * @param {String} data The data to send [optional]
   */
  send : function (data)
  {
    var
      self = this,
      callbackName = 'jsonp' + self._id + (self.__index++),
      script_src = self._url + "&callback=" + callbackName,
      script = util.importFile (script_src, null, null, 'js'),
      removeScript = function ()
      {
        if (script)
        {
          script.parentElement.removeChild (script);
          script = undefined;
        }
      },
      abortTimeout = setTimeout (function ()
      {
        removeScript ();
        if (callbackName in window) delete (window [callbackName]);
        self.propagate ('loaderror', 'Impossible to load data');
      }, 3000);

    window [callbackName] = function (data) {
      clearTimeout (abortTimeout)
      removeScript ();
      delete window[callbackName];
      this._response_json = data;
      self.propagate ('jsonload', data);
    }

//    serializeData(options)

  }
};
util.extendClass (AjaxJSONP, core.EventSource);

/********************************************************************
                  Define class properties
********************************************************************/

util.defineClassProperties (AjaxJSONP, {
  "url": {
    /**
     * Setter for the url
     * @name vs.core.AjaxJSONP#url
     * @type String
     */
    set : function (v)
    {
      if (!util.isString (v)) { return; }

      this._url = v;
    }
  },

  'responseJson': {
    /**
     * Return request result as Javascript Object
     * @name vs.core.AjaxJSONP#responseJson
     * @type Document
     */
    get : function ()
    {
      return this._response_json;
    }
  }
});

/********************************************************************
                      Export
*********************************************************************/
/** @private */
core.AjaxJSONP = AjaxJSONP;

# VS Toolkit, the mobile HTML5 toolkit used with VSD.

Copyright © 2009 - 2012 [ViniSketch SARL](http://www.vinisketch.com/)


## Usage


## Create a class

```
var myClass = vs.core.createClass ({

  parent: vs.ui.View,
 
  properties : {propName: vs.core.Object.PROPERTY_IN_OUT},
 
  uneMethode : function (p1, p2, …)
  {
    this._super (p1, p2, …);
  }, 
  …
});
```

## Create a object from a VS class

```
var config = {
  id: 'xxx',
  …
}
// Object construction
var obj = new myClass (config);
// Object initialization
obj.init ();
```

## Properties

### Basic declaration

```
…
  properties : {propName: vs.core.Object.PROPERTY_IN_OUT},
…
```

Possible export value:
- vs.core.Object.PROPERTY_IN_OUT
- vs.core.Object.PROPERTY_IN
- vs.core.Object.PROPERTY_OUT

        
### Descriptor declaration

```
…
  properties : {
    propName: {
      set : function (v) {
        …
        this._prop_name = v;
      },
     
      get : function () {
        …
        return this._prop_name
      }
    }
  },
…
```
        
 ### Path declaration
 
This third syntax allow to easily export a child component's property.
 
 
Within this example, my class exports as own property, the property named 'text' of its child 'textField'.
```
…
  properties : {text: "textField#text"}
…
```

This declaration is similar to declare:
```
…
  properties : {
    text: {
      set : function (v) {
        this.textField.text = v;
      },
     
      get : function () {
       return this.textField.text;
      }
    }
  },
…
```

##Create your first application

Javascript bootstrap

```
var myApp = vs.core.createClass ({

  /** parent class */
  parent: vs.ui.Application,

  /** call when vs.ui.Application.start (); is called */
  applicationStarted : function (event)
  {
    …
  }
});

function loadApplication ()
{
  new myApp ({id:"_myApp_"}).init ();

  vs.ui.Application.start ();
}
```

HTML

```
<!DOCTYPE html>
<html id="_myApp_">
  <head>

    <link rel="stylesheet" type="text/css" href="lib/css/vs_ui.css">
    <link rel="stylesheet" type="text/css" href="lib/css/vs_ui_ios.css">
    <link rel="stylesheet" type="text/css" href="css/myApp.css">

    <script type="text/javascript" src="lib/js/vs_util.js"></script>
    <script type="text/javascript" src="lib/js/vs_core.js"></script>
    <script type="text/javascript" src="lib/js/vs_data.js"></script>
    <script type="text/javascript" src="lib/js/vs_ui.js"></script>
    <script type="text/javascript" src="lib/js/vs_fx.js"></script>
    <script type="text/javascript" src="lib/js/vs_ext.js"></script>
    <script type="text/javascript" src="lib/js/vs_ext_fx.js"></script>
    <script type="text/javascript" src="js/myApp.js"></script>

  </head>
  <body class="application" x-hag-hole="children" onload="loadApplication ()">
  </body>
</html>
```

## Warning ;-)

Keep in mind the toolkit is under development. Your are welcome to give feedback :)



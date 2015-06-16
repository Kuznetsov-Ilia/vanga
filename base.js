var template = document.createElement('template');
var div = document.createElement('div');
var fragment = document.createDocumentFragment();
var textNode = document.createTextNode('');
import {isObject, isArray} from 'misc/utils';
export default class Template {

  constructor(html, conf, attrs, classes, forwarding) {
    this.html = html;
    this.conf = conf;
    this.attrs = attrs;
    this.classes = classes;
    this.forwarding = forwarding;
    this.subClass = {};
    this.prev = {};
  }

  set (key, value, _all) {
    if (isObject(key)) {
      var _this = this;
      Object.keys(key).forEach(function(k){
        _this.set(k, key[k], key);
      });
    } else if (key in this.conf) {
      this.conf[key].forEach(setItem(key, value, this, _all));
      if (key in this.forwarding) {
        this.forwarding[key].forEach(setForwarding(this.classes, value, _all));
      }
    } else {
      console.error('unknown key', key);
    }
  }

  get (key) {
    if (key in this.conf) {
      if (this.type[key] === 'text') {
        return this.el[key];
      }
    } else {
      return console.error('unknown key', key);
    }
  }

  clone (){
    var root = this.root.cloneNode(true);
    return new function() {
      this.root = root;
    };
  }

  render(data, domRoot) {
    var root = this.root = load(this.html);
    var conf = this.conf;
    var classes = this.classes;
    var _this = this;
    Object.keys(conf).forEach(function(key){
      conf[key]
        .map(process(root, classes, data[key] || {}, key, _this))
        .forEach(replaceMents);
    });
    domRoot.appendChild(this.root);
  }

  getValue (key, pendingValues) {
    if (pendingValues && key in pendingValues) {
      return pendingValues[key];
    } else {
      return this.prev[key];
    }
  }

}

function setForwarding(classes, value, _all) {
  return function(forwarded) {
    var fclass = classes[forwarded.sub];
    var fkey = forwarded.key;
    fclass.set(fkey, value, _all);
  };
}

function replaceMents(item) {
  if (item && item[0] && item[0].parentNode) {
    item[0].parentNode.replaceChild(item[1], item[0]);
  }
}

function process(root, classes, data, key, _this) {
  return function(item) {
    var newChild;
    var oldChild;
    var el;
    _this.prev[key] = '';
    if (['text', 'html', 'class'].indexOf(item.type) !== -1) {
      el = item.el = resolveEl(item.el, root);
    }
    switch (item.type) {
    case 'attr':
      item.el = resolveEl( _this.attrs[item.attr].el, root);
    break;
    case 'text':
      newChild = textNode.cloneNode(false);
      oldChild = el;
      item.el = newChild;
      return [oldChild, newChild];
    break;
    case 'class':
      oldChild = el;
      newChild = div.cloneNode(false);
      item.el = newChild;
      var instance = classes[item.sub]();
      _this.subClass[key] = instance;
      var shallWeRenderSubClass;
      if (item.test !== undefined) {
        if (_this.getValue(item.test, data)) {
          shallWeRenderSubClass = true;
        } else {
          shallWeRenderSubClass = false;
        }
      } else {
        shallWeRenderSubClass = true;
      }

      if (shallWeRenderSubClass) {
        instance.render(data, newChild);
        return [oldChild, newChild];
      }
    break;
    }
  };
}

function resolveEl(arr, root) {
  if (arr) {
    return arr.reduce(gotoChild, root);
  }
}
function gotoChild(root, index) {
  return root.childNodes[index];
}

function replaceAttr(_this) {
  return function(tmpl, key) {
    return tmpl.replace('{' + key + '}', _this.prev[key]);
  };
}
function templateFallback(root) {
  var f = fragment.cloneNode(false);
  var child;
  while (child = root.firstElementChild) {
    f.appendChild(child);
  }
  return f;
}

function load (strHTML) {
  var root = template.cloneNode(false);
  root.innerHTML = strHTML;
  return root.content || templateFallback(root);
}
function setItem(key, value, _this, _all) {
  return function (item){
    if (_this.prev[key] === value) {
      console.log('need caching system for complex & multiple updates');
    }
    switch (item.type) {
    case 'text':
      item.el.nodeValue = value;
      item.prev = value;
    break;
    case 'attr':
      var attr = _this.attrs.filter(function(a){ return a.key.indexOf(key) !== -1; })[0];
      var val;
      //var _this = this;
      _this.prev[key] = value;
      if (attr.isComplex) {
        if (attr.key) {
          if (_all) {
            attr.key.forEach(function(k) {
              if (k in _all) {
                _this.prev[k] = _all[k];
              }
            });
          }
          val = attr.key.reduce(replaceAttr(_this), attr.tmpl);
        }
      } else {
        val = value;
      }
      item.el.setAttribute(attr.name, val);
    break;
    case 'html':
      var newChild = div.cloneNode(false);
      newChild.innerHTML = value;
      var oldChild = item.el;
      oldChild.parentNode.replaceChild(newChild, oldChild);
      item.el = newChild;
      item.prev = value;
    break;
    case 'class':
      if (isObject(value)) {
        if (isArray(value)) {
          /*_this.subClass[key].clone()
          value.forEach(function(val){
            _this.subClass[key].set(value);
          });*/
        } else {
          _this.subClass[key].set(value);
        }
      } else if (DEBUG) {
        console.error('value must be Object to set it to subclass', key, value);
      }
    break;
    }
  };
}

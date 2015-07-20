//import 'babel-core/polyfill';
var template = document.createElement('template');
var div = document.createElement('div');
div.className = 'base-wrapper';
var fragment = document.createDocumentFragment();
var textNode = document.createTextNode('');
//var commentNode = document.createComment('');
var clonedTags = {
  div: div
};

import {isObject, isArray, isString, isFragment } from 'misc/utils';
export default class Template {

  constructor(html, conf, attrs, shared, binded) {
    this.html = html;
    this.conf = conf;
    this.state = {};
    this.attrs = attrs;
    this.shared = shared;
    this.binded = binded;
    this.pendingUpdates = false;
    this.pendingBinds = false;
    this.isRendered = false;
  }


  recursiveSet (key) {
    var _this = this;
    return Object.keys(key).reduce(set, []);

    function set (result, k) {
      return result.concat(_this.set(k, key[k], key));
    }
  }
  set (key, value) {
    var updates;
    if (isObject(key)) {
      if (this.pendingUpdates) {
        return this.recursiveSet(key);
      } else {
        this.pendingUpdates = true;
        commit(this.recursiveSet(key)/*, this.prev*/);
        this.pendingUpdates = false;
      }
    } else if (isObject(this.state.vars) && key in this.state.vars) {
      var state = this.state.vars[key];
      var setter = setItem(key, value, this);
      if (isArray(state)) {
        updates = state.map(setter);
      } else {
        debugger;
        //updates = setter(conf);
      }
      //checkBindings(state.instance, key, value);
      if (this.pendingUpdates || this.pendingBinds) {
        return updates;
      } else {
        commit(updates/*, this.prev*/);
      }
    } else {
      //debugger;
      //checkBindings(this, key, value);
      //console.error('unknown key', key);
    }

    //return this;

  }

  get (key) {
    var state = this.state.vars[key];
    return state ? state[0].instance : false;
    /*if (key in this.sub) {
      return this.sub[key];
      //if (this.type[key] === 'text') {
        //return this.el[key];
      //}
    } else {
      return console.error('unknown key', key);
    }*/
  }

  clone () {

    var clone = new Template(this.html, this.conf, this.attrs, this.shared, this.binded);
    //var sub = this.sub;
    //clone.sub = Object.keys(this.sub).reduce((clonedSub, key) => clonedSub[key] = sub[key].clone(), {});
    if (this.root) {
      clone.root = this.root.cloneNode(true);
    } else {
      debugger;
    }
    return clone;
  }

  remove () {
    if (0 && this.parent) {
      this.parent.removeChild(this.root);
    }
    if (isArray(this.root)) {
      var parent = this.root[0].parentNode;
      this.root.forEach(el => {parent.removeChild(el); });
    } else {
      debugger;
    }
  }

  render(rootToBeRenderedTo) {
    if (this.isRendered) {
      return this;
    }
    var root = this.root;
    if (!root) {
      //root = this.root = loadWithDiv(this.html);
      root = this.root = loadWithIframe(this.html);
    }
    var conf = this.conf;
    var shared = this.shared;
    //var sub = this.sub;
    var attrs = this.attrs;
    this.state.vars = Object.keys(conf).reduce((state, key) => {
      var a = conf[key].reduce(prepareState(root, attrs, key,/* sub,*/ shared), {childs:[], states:[]});
      a.childs.forEach(replaceChildren);
      state[key] = a.states;
      return state;
    }, {});
    if (rootToBeRenderedTo) {
      var back = root.cloneNode(true);
      rootToBeRenderedTo.appendChild(root);
      this.root = back;
      this.parent = rootToBeRenderedTo;
    }
    this.isRendered = true;
    return this;
  }
}

function checkBindings(_this, key, value) {
  //console.log('key:', key, ', value:', value, ', binded:', _this.binded);
  if (key in _this.binded) {
    var updates = _this.binded[key].map(setBindings(_this, key, value));
    if (_this.pendingBinds || _this.pendingUpdates) {
      return updates;
    } else {
      commit(updates/*,  this.prev*/);
    }
  }
  return [];
}

function prepareState(root, attrs, key, /*sub,*/ shared) {
  return function(reduced, confItem) {
    var path;
    if (['text', 'html', 'class'].includes(confItem.type)) {
      path = confItem.path;
    } else if (confItem.type === 'attr') {
      path = attrs[confItem.attr].path;
    } else if (DEBUG) {
      console.log('no path for type', confItem.type);
    }
    if (path) {
      var newChild;
      var oldChild;
      var el = resolveEl(path, root);
      if (!el) {
        debugger;
      }
      var states = {
        type: confItem.type,
        el: el
      };
      if (confItem.type === 'text') {
        newChild = textNode.cloneNode();
        oldChild = el;
        states.el = newChild;
        reduced.childs.push([oldChild, newChild]);
      } else if (confItem.type === 'class') {
        oldChild = el;
        var tag = confItem.tag;
        if (0 && tag) {
          if (!clonedTags[tag]) {
            clonedTags[tag] = document.createElement(tag);
          }
          newChild = clonedTags[tag].cloneNode();
        } else {
          //newChild = div.cloneNode();
          newChild = fragment.cloneNode();
        }
        if (0 && confItem.attrs) {
          confItem.attrs.forEach(attr => {
            var value = attr.value;
            if (isObject(value)) {
              console.error('data-* is not implemented');
            } else {
              newChild.setAttribute(attr.name, value);
            }
          });
        }
        states.el = oldChild;
        states.prevEl = newChild;
        states.isHidden = true;
        states.instance = shared[key].render().clone().render(newChild);
        //sub[key] = shared[key];
        //sub[key].render(newChild);
      }
      reduced.states.push(states);
    } else {
      debugger;
    }
    return reduced;
  };
}

function commit(updates/*, prev*/) {
  var a = updates.reduce(combineUpdates, {el: [], updates: [], prev: {} });
  if (a && a.updates) {
    a.updates.map(doUpdates);
    /*Object.assign(prev, a.prev);*/
  }
}

function combineUpdates(result, up) {
  if (up === undefined) {
    return result;
  }

  var updateKey = result.el.indexOf(up.el);
  if (updateKey === -1) {
    updateKey = result.el.push(up.el) - 1;
  }

  result.updates[updateKey] = result.updates[updateKey] || {};
  result.updates[updateKey].el = up.el;
  switch (up.type) {
  case 'html':
    result.updates[updateKey].html = up.el;
  break;
  case 'attr':
    result.updates[updateKey].attr = result.updates[updateKey].attr || {};
    result.updates[updateKey].attr[up.opts.attr] = up.opts.tmpl.join('');
  break;
  case 'text':
    result.updates[updateKey].text = up.value;
  break;
  case 'map':
    result.updates[updateKey].map = up;
  break;
  }
  result.prev[up.key] = up.value;
  return result;
}

function doUpdates(update) {
  if (update.attr) {
    Object.keys(update.attr).forEach(function(key) {
      update.el.setAttribute(key, update.attr[key]);
    });
  } else if (update.text) {
    update.el.nodeValue = update.text;
  } else if (update.html) {
    var oldChild = update.html[0];
    var newChild = update.html[1];
    oldChild.parentNode.replaceChild(newChild, oldChild);
  } else if (update.map) {
    //
  } else if (update.el === undefined) {
  } else debugger;
}

function setBindings(_this, key, value) {
  return function(_subName) {
    var keyToBind;
    var subName;
    if (isString(_subName)) {
      subName = _subName;
      keyToBind = key;
    } else if (isArray(_subName)) {
      subName = _subName[0];
      keyToBind = _subName[1];
    }
    var bindedValue = {};
    bindedValue[keyToBind] = value;
    _this.pendingBinds = true;
    console.log('setBindings', subName, bindedValue);
    var updates = _this.set(subName, bindedValue);
    _this.pendingBinds = false;
    return updates;
    /*var subToBind = _this.state.vars[subName];
    subToBind.pendingBinds = true;
    var updates = subToBind.map(sub => {
      if (sub.isHidden) {
        togglePrevEl(sub);
        sub.isHidden = false;
      }
      sub.instance.pendingBinds = true;
      var subUpdates = sub.instance.set(keyToBind, value);
      sub.instance.pendingBinds = false;
      return subUpdates;
    });
    subToBind.pendingBinds = false;
    return updates;*/
  };
}

function replaceChildren(i) {
  //if (i/* && i[0] && i[0].parentNode*/) {
  i[0].parentNode.replaceChild(i[1], i[0]);
  //}
}

function resolveEl(arr, root) {
  if (arr) {
    return arr.reduce(gotoChild, root);
  }
}
function gotoChild(root, index) {
  return root.childNodes[index];
}

function loadWithDiv (strHTML) {
  var root = div.cloneNode();
  root.innerHTML = strHTML;
  return root;
}
function loadWithIframe (strHTML) {
  var root = template.cloneNode();
  //var root = div.cloneNode();
  root.innerHTML = strHTML;
  return root.content || templateFallback(root);
  //return templateFallback(root);
}
function templateFallback(root) {
  var f = fragment.cloneNode(false);
  var child;
  while (child = root.firstElementChild) {
    f.appendChild(child);
  }
  return f;
}

function setItem(key, value, _this) {
  return function (item) {
    if (item.prevValue !== value) {
      item.prevValue = value;
      switch (item.type) {
      case 'text':
        return {type: 'text', el: item.el, value: value, key: key};
      /*break;*/
      case 'attr':
        return {
          type: 'attr',
          el: item.el,
          value: value,
          key: key,
          opts: _this.attrs
            .filter(a => key in a.keys)
            .reduce((tmpl, attr) => ({
                attr: attr.name,
                tmpl: attr.keys[key].reduce((_tmpl, keyIndex) => {
                  _tmpl[keyIndex] = value;
                  return _tmpl;
                }, attr.tmpl)
              }), {})
        };
      /*break;*/
      case 'html':
        var newChild = div.cloneNode();
        var oldChild = item.el;
        newChild.innerHTML = value;
        item.el = newChild;
        return {
          type: 'html',
          el: [oldChild, newChild],
          key: key,
          value: value
        };
      /*break;*/
      case 'class':
        if (isArray(value)) {
          if (item.isHidden) {
            togglePrevEl(item);
            item.isHidden = false;
          }
          if (value.length > 1) {
            if (item.clones) {
              doClonedStaff(item, value);
            } else {
              makeClones(item, value.length, item.instance);
            }
            value.forEach((v, i) => { item.clones[i].set(v); });
            var targetNode;
            if (item.el.length) {
              targetNode = item.el[item.el.length - 1];
            } else {
              targetNode = item.el;
            }

            //var newRoots = Array.from(item.f.childNodes).map(child => child);
            targetNode.parentNode.insertBefore(item.f, null);

            //var l = newRoots.length;
            //while (--l) {
             // newRoots[l]
            //}
          } else {
            item.instance.set(value[0]);
          }

        } else if (isObject(value)) {
          if (item.isHidden) {
            togglePrevEl(item);
            item.isHidden = false;
          }
          item.instance.set(value);
          //if (item.instance) {
            //debugger;
            //console.log('checkBindings', key, value, item.instance.bindings);
            //checkBindings(item.instance, key, value);
          //}
          //_this.sub[key].set(value);
        } else if ([false, 0, '0', null].includes(value)) {
          if (!item.isHidden) {
            togglePrevEl(item);
            item.isHidden = true;
          }
        } else if ([true, 1, '1'].includes(value)) {
          if (item.isHidden) {
            togglePrevEl(item);
            item.isHidden = false;
          }
        } else if (DEBUG) {
          console.error('unsuported value type to set to subclass', key, value);
        }
      break;
      }
    } else{
      //debugger;
      //console.log('TODO: caching system for complex & multiple updates');
      /*if (value !== undefined) {
        console.log('not changed', key, value, item.prevValue);
      }*/
    }
  };
}
function togglePrevEl(item) {
  var newChild = item.prevEl/* || commentNode.cloneNode()*/;
  var oldChild = item.el;
  var newRoot;

  if (isFragment(newChild)) {
    if (newChild.childNodes.length === 1) {
      newRoot = newChild.childNodes[0];
    } else {
      newRoot = newChild.childNodes.slice(0)//.map(child => child);
    }
  }
  //var newRoot = newChild.childNodes;
  if (isArray(oldChild)) {
    debugger;
  }
  oldChild.parentNode.replaceChild(newChild, oldChild);
  if (isFragment(newChild)) {
    newChild = newRoot;
  }
  item.el = newChild;
  item.prevEl = oldChild;
}

function makeClones(item, valLength, toBeCloned) {
  var f = fragment.cloneNode();
  var k = toBeCloned.root.childNodes.length;
  item.clones = [toBeCloned];
  for (var i = 1; i < valLength; i++) {
    var clone = toBeCloned.clone();
    clone.render(f);
    clone.root = f.childNodes.slice((i - 1) * k);//
    item.clones.push(clone);
  }
  item.f = f;
}

function doClonedStaff(item, value) {
  var valLength = value.length;
  var clonLength = item.clones.length;
  if (clonLength > valLength) {
    item.clones.slice(valLength).forEach(tmpl => { tmpl.remove(); tmpl = null; });
  } else if (clonLength < valLength) {
    var f = fragment.cloneNode();
    var toBeCloned = item.instance;
    //item.clones.reduce(c => (f.appendChild(c.root.cloneNode(true)), f), f);
    for (var i = clonLength; i <= valLength; i++) {
      var clone = toBeCloned.clone().render(f);
      item.clones.push(clone);
    }
    item.f = f;
  }
}


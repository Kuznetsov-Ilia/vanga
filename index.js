'use strict';

var _window = self || window;
var head = document.head || document.getElementsByTagName('head')[0];

function isObject(value) {
  return typeof value === 'object' && value !== null;
}
function isFunction(value) {
  return typeof value === 'function';
}
function isNode(value) {
  return value instanceof _window.Node;
}
if (!Array.isArray) {
  var op2str = Object.prototype.toString;
  Array.isArray = function(a) {
    return op2str.call(a) === '[object Array]';
  };
}
function isArray(value) {
  return Array.isArray(value);//return isset(value) && value instanceof Array;
}
function isset(value) {
  return value !== undefined;
}
function isFragment(node) {
  return isset(node) && node.nodeType === _window.Node.DOCUMENT_FRAGMENT_NODE;
}

var slice = Array.prototype.slice;
var Events = {
  // Bind an event to a `callback` function. Passing `"all"` will bind
  // the callback to all events fired.
  on: function (name, callback, context) {
    if (!eventsApi(this, 'on', name, [callback, context]) || !callback) {
      return this;
    }
    if (!this._events) {
      this._events = {};
    }
    var events = this._events[name] || (this._events[name] = []);
    events.push({
      callback: callback,
      context: context,
      ctx: context || this
    });
    return this;
  },

  // Bind an event to only be triggered a single time. After the first time
  // the callback is invoked, it will be removed.
  once: function (name, callback, context) {
    if (!eventsApi(this, 'once', name, [callback, context]) || !callback) {
      return this;
    }
    var self = this;
    var _once = once(function () {
      self.off(name, _once);
      callback.apply(this, arguments);
    });
    _once._callback = callback;
    return this.on(name, _once, context);
  },

  // Remove one or many callbacks. If `context` is null, removes all
  // callbacks with that function. If `callback` is null, removes all
  // callbacks for the event. If `name` is null, removes all bound
  // callbacks for all events.
  off: function (name, callback, context) {
    var retain, ev, events, names, i, l, j, k;
    if (!this._events || !eventsApi(this, 'off', name, [callback, context])) {
      return this;
    }
    if (!name && !callback && !context) {
      this._events = {};
      return this;
    }
    names = name ? [name] : Object.keys(this._events);
    for (i = 0, l = names.length; i < l; i++) {
      name = names[i];
      events = this._events[name];
      if (events) {
        this._events[name] = retain = [];
        if (callback || context) {
          for (j = 0, k = events.length; j < k; j++) {
            ev = events[j];
            if ((callback && callback !== ev.callback && callback !== ev.callback._callback) ||
              (context && context !== ev.context)) {
              retain.push(ev);
            }
          }
        }
        if (!retain.length) {
          delete this._events[name];
        }
      }
    }

    return this;
  },

  // Trigger one or many events, firing all bound callbacks. Callbacks are
  // passed the same arguments as `trigger` is, apart from the event name
  // (unless you're listening on `"all"`, which will cause your callback to
  // receive the true name of the event as the first argument).
  trigger: function (name) {
    if (!this._events) {
      return this;
    }
    var args = slice.call(arguments, 1);
    if (!eventsApi(this, 'trigger', name, args)) {
      return this;
    }
    var events = this._events[name];
    var allEvents = this._events.all;
    if (events) {
      triggerEvents(events, args);
    }
    if (allEvents) {
      triggerEvents(allEvents, arguments);
    }
    return this;
  },

  // Tell this object to stop listening to either specific events ... or
  // to every object it's currently listening to.
  stopListening: function (obj, name, callback) {
    var listeningTo = this._listeningTo;
    if (!listeningTo) {
      return this;
    }
    var remove = !name && !callback;
    if (!callback && typeof name === 'object') {
      callback = this;
    }
    if (obj) {
      (listeningTo = {})[obj._listenId] = obj;
    }
    for (var id in listeningTo) {
      obj = listeningTo[id];
      obj.off(name, callback, this);
      if (remove || !Object.keys(obj._events).length) {
        delete this._listeningTo[id];
      }
    }
    return this;
  }
};
// Regular expression used to split event strings.
var eventSplitter = /\s+/;
var listenMethods = {
  listenTo: 'on',
  listenToOnce: 'once'
};
var uniqueId = 0;
// Inversion-of-control versions of `on` and `once`. Tell *this* object to
// listen to an event in another object ... keeping track of what it's
// listening to.
var implementation;



for (var method in listenMethods) {
  implementation = listenMethods[method];
  Events[method] = function (obj, name, callback) {
    var listeningTo = this._listeningTo || (this._listeningTo = {});
    var id = obj._listenId || (obj._listenId = 'l_' + uniqueId++);
    listeningTo[id] = obj;
    if (!callback && typeof name === 'object') {
      callback = this;
    }
    obj[implementation](name, callback, this);
    return this;
  };
}

function once(func) {
  var ran,
    result;

  if (!isFunction(func)) {
    throw new TypeError();
  }
  return function () {
    if (ran) {
      return result;
    }
    ran = true;
    result = func.apply(this, arguments);

    // clear the `func` variable so the function may be garbage collected
    func = null;
    return result;
  };
}


// Implement fancy features of the Events API such as multiple event
// names `"change blur"` and jQuery-style event maps `{change: action}`
// in terms of the existing API.
function eventsApi(obj, action, name, rest) {
  if (!name) {
    return true;
  }

  // Handle event maps.
  if (typeof name === 'object') {
    for (var key in name) {
      obj[action].apply(obj, [key, name[key]].concat(rest));
    }
    return false;
  }

  // Handle space separated event names.
  if (eventSplitter.test(name)) {
    var names = name.split(eventSplitter);
    for (var i = 0, l = names.length; i < l; i++) {
      obj[action].apply(obj, [names[i]].concat(rest));
    }
    return false;
  }

  return true;
}

// A difficult-to-believe, but optimized internal dispatch function for
// triggering events. Tries to keep the usual cases speedy (most internal
// Backbone events have 3 arguments).
function triggerEvents(events, args) {
  var ev,
    i = -1,
    l = events.length,
    a1 = args[0],
    a2 = args[1],
    a3 = args[2];
  switch (args.length) {
  case 0:
    while (++i < l) {
      (ev = events[i]).callback.call(ev.ctx);
    }
    return;
  case 1:
    while (++i < l) {
      (ev = events[i]).callback.call(ev.ctx, a1);
    }
    return;
  case 2:
    while (++i < l) {
      (ev = events[i]).callback.call(ev.ctx, a1, a2);
    }
    return;
  case 3:
    while (++i < l) {
      (ev = events[i]).callback.call(ev.ctx, a1, a2, a3);
    }
    return;
  default:
    while (++i < l) {
      (ev = events[i]).callback.apply(ev.ctx, args);
    }
  }
}

function Eventable(target) {
  return Object.assign(target, Events);
}

var TEMPLATE;
var DIV;
var FRAGMENT;
var TEXTNODE;
var LIST;

function Template(html, conf, attrs, shared, binded) {
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
Object.assign(Eventable(Template.prototype), {
  recursiveSet (key) {
    var _this = this;
    return Object.keys(key).reduce(set, []);
    function set (result, k) {
      return result.concat(_this.set(k, key[k], key));
    }
  },
  set (key, value) {
    var updates;
    if (isObject(key)) {
      if (this.pendingUpdates) {
        return this.recursiveSet(key);
      } else {
        this.pendingUpdates = true;
        commit(this.recursiveSet(key));
        this.pendingUpdates = false;
      }
    } else if (isObject(this.state) && key in this.state) {
      var state = this.state[key];
      var setter = setState(key, value, this);
      if (isArray(state)) {
        updates = state.map(setter);
      } else {
        throw {text: 'must be array', info: state};
      }
      if (this.pendingUpdates || this.pendingBinds) {
        return updates;
      } else {
        commit(updates);
      }
    } else {
      console.error('unknown key', key);
    }
  },

  reset (obj) {
    var keys = Object.keys(this.conf)
      .filter(key => !this.conf[key].some(conf => conf.type === 'named'))
      .reduce(
        (obj, key) => {
          obj[key] = '';
          return obj
        }, {}
      );
    if (typeof obj === 'object') {
      Object.assign(keys, obj);
    }
    this.set(keys);
  },

  get (key) {
    if (key) {
      return key.split('/').reduce((acc, name) => {
        if (isObject(acc) && isObject(acc.state)) {
          var state = acc.state[name];
          if (state && state[0]) {
            if (state[0].clones) {
              return state[0].clones;
            } else {
              return state[0].template || state[0];
            }
          }
        }
      }, this);
    } else {
      console.error('unknown key', key, 'in', this.state);
    }
  },

  getEl(key) {
    var state = this.state[key];
    return state ? state[0].el : false;
  },
  val (key) {
    var state = this.state[key];
    return state ? state[0].prevValue : undefined;
  },

  clone () {
    var clone = new Template(this.html, this.conf, this.attrs, this.shared, this.binded);
    if (this.root) {
      clone.root = this.root.cloneNode(true);
    } else {
      //throw {text: 'no root to clone', info: this};
    }
    return clone;
  },

  remove () {
    if (this.el) {
      if (this.isRemovable) {
        this.el.remove();
        this.isRendered = false;
      } else {
        this.removeComment = this.removeComment || TEXTNODE.cloneNode(false);
        this.hiddenEl = this.el;
        this.el.replaceWith(this.removeComment);
        this.el = this.removeComment;
        //Object.keys(this.state).forEach(key => this.state[key].forEach(hide));
      }
    }
    this.isRemoved = true;
  },

  render(rootToBeRenderedTo) {
    if (this.isRendered) {
      if (this.isRemoved) {
        if (this.hiddenEl) {
          this.el.replaceWith(this.hiddenEl);
          this.el = this.hiddenEl;
          this.hiddenEl = null;
          
        } else {
          if (rootToBeRenderedTo !== undefined) {
            this.parent = rootToBeRenderedTo;
          }
          if ([Node.TEXT_NODE, Node.COMMENT_NODE].includes(rootToBeRenderedTo.nodeType)) {
            this.el = this.el.lastChild;
            rootToBeRenderedTo.replaceWith(this.el);
            this.parent = this.el.parentNode;
          } else {
            rootToBeRenderedTo.appendChild(this.el);
            this.el = rootToBeRenderedTo.lastChild;
            this.parent = rootToBeRenderedTo;
          }
        }
        this.isRemoved = false;
      }
      return this;
    }

    if (LIST === undefined) {
      LIST = document.createElement('x-list');
    }
    if (TEXTNODE === undefined) {
      TEXTNODE = document.createTextNode('');
    }
    if (FRAGMENT === undefined) {
      FRAGMENT = document.createDocumentFragment();
    }
    if (DIV === undefined) {
      DIV = document.createElement('x-div');
    }
    
    var root = this.root;
    if (!root) {
      root = this.root = loadWithIframe(this.html);
    }
    var conf = this.conf;
    var shared = this.shared;
    var attrs = this.attrs;

    this.state = Object.keys(conf).reduce((state, key) => {
      var {childs, states} = conf[key].reduce(
        prepareState(this, root, attrs, key, shared),
        {childs: [], states: []}
      );
      childs.forEach(replaceChildren);
      state[key] = states;
      return state;
    }, {});
    if (rootToBeRenderedTo) {
      var back = root.cloneNode(true);
      if ([Node.TEXT_NODE, Node.COMMENT_NODE].includes(rootToBeRenderedTo.nodeType)) {
        this.el = root.lastChild;
        rootToBeRenderedTo.replaceWith(root);
        this.parent = root.parentNode;
      } else {
        rootToBeRenderedTo.appendChild(root);
        this.el = rootToBeRenderedTo.lastChild;
        this.parent = rootToBeRenderedTo;
      }
      this.root = back;
    }
    this.isRendered = true;
    return this;
  }
});

function prepareState(_this, root, attrs, key, shared) {
  return function(reduced, confItem) {
    var path;
    if (['text', 'html', 'class', 'named'].includes(confItem.type)) {
      path = confItem.path;
    } else if (confItem.type === 'attr') {
      path = attrs[confItem.attr].path;
    }
    if (path !== undefined) {
      var newChild;
      var oldChild;
      var el = resolveEl(path, root);
      if (!isNode(el)) {
        throw {text: 'no el resolved', info: confItem};
      }
      if (isArray(confItem.events)) {
        confItem.events.forEach(eventName => el.addEventListener(eventName, e => (_this.trigger(`${key}:${eventName}`, e), false)));
      }
      var state = {
        type: confItem.type,
        el: el
      };
      switch (confItem.type) {
      case 'attr':
        state.attr = confItem.attr;
        break;
      case 'text':
        newChild = TEXTNODE.cloneNode(false);
        oldChild = el;
        state.el = newChild;
        reduced.childs.push([oldChild, newChild]);
        break;
      case 'class':
        oldChild = el;
        newChild = FRAGMENT.cloneNode(false);
        state.el = oldChild;
        state.prevEl = newChild;

        if (shared[key] !== undefined) {
          if (shared[key] instanceof Template) {
            state.isHidden = true;
            state.template = shared[key].render().clone().render(state.prevEl);
          } else if (typeof shared[key] === 'string' ) {
            newChild = DIV.cloneNode(false);
            newChild.html(shared[key]);
            if (newChild.childNodes.length === 1) {
              newChild = newChild.childNodes[0];
            }
            oldChild = el;
            state.el = newChild;
            reduced.childs.push([oldChild, newChild]);
          } else {
            state.isHidden = true;
            state.template = new shared[key]({
              data: confItem.data,
              clone: function (_this, template) {
                _this.template = template.render().clone().render(state.prevEl);
                // /debugger;
              }
            });
          }
        } else {
          throw {text: key + ' is not defined', info: {shared, key}};
        }
        break;
      case 'named':
        state.el = el;
        state.isHidden = false;
        state.prevEl = document.createComment(key);
        state.name = confItem.name;
        state.input = confItem.input;
        break;
      }
      reduced.states.push(state);
    } else {
      throw {text: 'no path specified', info: confItem};
    }
    return reduced;
  };
}

function commit(updates) {
  var a = updates.reduce(combineUpdates, {el: [], updates: [], prev: {} });
  if (a && a.updates) {
    a.updates.map(doUpdates);
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

  var resUP = result.updates[updateKey] || {};
  resUP.el = up.el;
  switch (up.type) {
  case 'html':
    resUP.html = up.el;
    break;
  case 'attr':
    resUP.attr = resUP.attr || {};
    resUP.attr[up.opts.attrName] = up.opts.tmpl.join('');
    break;
  case 'text':
    var value;
    switch (typeof up.value) {
    case 'number':
    case 'string':
      value = up.value;
      break;
    default:
      value = '';
      break;
    }
    resUP.text = value;
    break;
  case 'map':
    debugger;
    resUP.map = up;
    break;
  }

  result.updates[updateKey] = resUP;
  return result;
}

function doUpdates(update) {
  if (update.attr) {
    Object.keys(update.attr).forEach(key => {
      var val = update.attr[key];
      if (key === 'style') {
        var styles = val.split(';').reduce((acc, v) => {
          var _v = v.split(':')
          acc[_v[0]] = _v[1];
          return acc;
        }, {});
        Object.assign(update.el.style, styles);
      } else {
        update.el.setAttribute(key, val);
        /*switch (String(update.el)) {
        case '[object HTMLTextAreaElement]':
        case '[object HTMLInputElement]':
        case '[object HTMLSelectElement]':*/
          if (['value'].indexOf(key) !== -1) {
            update.el[key] = val;
          } else if (['checked', 'disabled', 'selected', 'readonly'].indexOf(key) !== -1) {
            if (['0', 'false'].indexOf(val) !== -1) {
              val = false;
            } else {
              var num_val = Number(val);
              if (isNaN(num_val)) {
                num_val = val;
              }
              val = Boolean(num_val);
            
            }
            update.el[key] = val;
          }
          /*break;
        }*/
      }
    });
  } else if ('text' in update) {
    update.el.nodeValue = update.text;
  } else if ('html' in update) {
    replaceChildren(update.html);
    /*var oldChild = update.html[0];
    var newChild = update.html[1];
    oldChild.replaceWith(newChild);*/
  } else if (update.map) {
    //
  } else if (update.el === undefined) {
  } else {
    throw {text: 'unhandled case', info: update};
  }
}

function replaceChildren(i) {
  i[0].replaceWith(i[1]);
}

function resolveEl(arr, root) {
  if (arr) {
    return arr.reduce(gotoChild, root);
  }
}
function gotoChild(root, index) {
  return root.childNodes[index];
}

function loadWithIframe (strHTML) {
  if (TEMPLATE === undefined) {
    TEMPLATE = document.createElement('template');
  }
  var root = TEMPLATE.cloneNode(false);
  root.innerHTML = strHTML;
  return root.content || templateFallback(root);
}

function templateFallback(root) {
  var f = FRAGMENT.cloneNode(false);
  var child;
  while (child = root.firstElementChild) {
    f.appendChild(child);
  }
  return f;
}


function setState(key, value, _this) {
  var originalValue = value;
  return function (state) {
    if (state.prevValue !== originalValue) {
      if (typeof value === 'object') {
        state.prevValue = {};
      } else if (state.input === 'radio') {
        value = state.name === originalValue;
        state.prevValue = value;
        state.originalValue = originalValue;
      } else {
        state.prevValue = value;
      }
      switch (state.type) {
      case 'text':
        return {type: 'text', el: state.el, value: value, key: key};
      case 'attr':
        var attr = _this.attrs[state.attr];
        return {
          type: 'attr',
          el: state.el,
          value: value,
          key: key,
          opts: {
            attrName: attr.name,
            tmpl: attr.keys[key].reduce((acc2, keyIndex) => {
              acc2[keyIndex] = value;
              return acc2;
            }, attr.tmpl)
          }
        };
      case 'html':
        var newChild = DIV.cloneNode(false);
        var oldChild = state.el;
        newChild.innerHTML = value;
        state.el = newChild;
        return {
          type: 'html',
          el: [oldChild, newChild],
          key: key,
          value: value
        };
      case 'class':
        if (typeof state.template === 'function') {
          state.template();
        }    
        if (isArray(value)) {
          show(state);
          if (value.length > 1) {
            if (state.clones) {
              doClonedStaff(state, value);
            } else {
              makeClones(state, value.length, state.template);
            }
            value.forEach((v, i) => {
              var clone = state.clones[i];
              if (clone) {
                if (isArray(v)) {
                  console.error('dont know how to set array');
                } else if (isObject(v)) {
                  clone.set(v);
                } else if (hidable(v)) {
                  hide(clone);
                } else if (showable(v)) {
                  show(clone);
                }                
              }
            });

            if (state.ELIsList) {
              state.el.appendChild(state.fragment);
            } else {
              state.ELIsList = true;
              var list = LIST.cloneNode(false);
              list.appendChild(state.fragment);
              var parent = state.el.parentNode;
              var first = parent.replaceChild(list, state.el);
              list.insertBefore(first, list.childNodes[0]);
              state.el_back = state.el;
              state.el = list;
            }
          } else {
            if (state.ELIsList) {
              state.ELIsList = false;
              var textNode = TEXTNODE.cloneNode(false);
              state.el.parentNode.replaceChild(state.el_back, state.el).remove();
              state.el = state.el_back;
            }
            if (state.clones && state.clones.length > 1) {
              var l = state.clones.length - 1;
              while (l--) {
                state.clones.pop().remove();
              }
            }
            state.template.set(value[0]);
          }
        } else if (isObject(value)) {
          show(state);
          state.template.set(value);
        } else if (hidable(value)) {
          hide(state);
        } else if (showable(value)) {
          show(state);
        }
      break;
      case 'named':
        if (hidable(value)) {
          hide(state);
        } else if (showable(value)) {
          show(state);
        }
      break;
      }
    }
  };
}
function togglePrevEl(state) {
  var newChild = state.prevEl || TEXTNODE.cloneNode(false);
  var oldChild = state.el;
  var newRoot;

  if (isFragment(newChild)) {
    if (newChild.childNodes.length === 1) {
      newRoot = newChild.childNodes[0];
    } else {
      newRoot = newChild.childNodes.slice(0);
    }
  }
  if (isArray(oldChild)) {
    var lastChild = oldChild.pop();
    if (lastChild) {
      lastChild.replaceWith(newChild);
    }
    oldChild.forEach(child => { child.remove(); } );
  } else {
    oldChild.replaceWith(newChild);
  }
  if (isFragment(newChild)) {
    newChild = newRoot;
  }
  state.el = newChild;
  state.prevEl = oldChild;
}

function makeClones(state, valLength, toBeCloned) {
  var fragment = FRAGMENT.cloneNode(false);
  //var k = toBeCloned.root.childNodes.length;
  state.clones = [toBeCloned];
  for (var i = 1; i < valLength; i++) {
    var clone = toBeCloned.clone().render(fragment);
    clone.isRemovable = true;
    //clone.root = fragment.childNodes.slice((i - 1) * k);
    clone.root = fragment.childNodes[i - 1];
    state.clones.push(clone);
  }
  state.fragment = fragment;
}

function doClonedStaff(state, value) {
  var valLength = value.length;
  var clonLength = state.clones.length;
  if (clonLength > valLength) {
    var diff = clonLength - valLength;
    while(diff--) {
      state.clones.pop().remove();
    }
  } else if (clonLength < valLength) {
    var fragment = FRAGMENT.cloneNode(false);
    var toBeCloned = state.template;
    for (var i = clonLength; i < valLength; i++) {
      var clone = toBeCloned.clone().render(fragment);
      clone.isRemovable = true;
      state.clones.push(clone);
    }
    state.fragment = fragment;
  }
}

function hidable(value){
  return !showable(value);
}
function hide(state) {
  if (!state.isHidden) {
    togglePrevEl(state);
    state.isHidden = true;
    state.prevValue = false;
  }
}
function showable(value) {
  switch (typeof value) {
  case 'object': return value !== null;
  case 'string': return value !== '' && value !== '0';
  case 'number': return value > 0;
  case 'boolean': return value;
  case 'undefined': return false;
  }
}
function show(state) {
  if (state.isHidden) {
    togglePrevEl(state);
    state.isHidden = false;
    state.prevValue = true;
  }
}

module.exports = Template;

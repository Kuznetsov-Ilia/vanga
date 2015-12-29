var TEMPLATE;
var DIV;
var FRAGMENT;
var TEXTNODE;
import {document} from 'global';
import {isObject, isArray, isFragment} from 'misc/utils';
export default Template;
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
Object.assign(Template.prototype, {
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

  get (key) {
    var state = this.state[key];
    if (state && state[0]) {
      return state[0].template || state[0];
    }
    else {
      console.error('unknown key', key, 'in', this.state);
    }
  },

  getEl(key) {
    var state = this.state[key];
    return state ? state[0].el : false;
  },

  clone () {
    var clone = new Template(this.html, this.conf, this.attrs, this.shared, this.binded);
    if (this.root) {
      clone.root = this.root.cloneNode(true);
    } else {
      throw {text: 'no root to clone', info: this};
    }
    return clone;
  },

  remove () {
    if (isArray(this.root)) {// removing unused clones
      this.root.forEach(el => { el.remove(); });
    } else { // removing explicitly outside
      if (this.parent) {
        this.parent.childNodes.forEach(el => { el.remove(); });
      } else if (this.el) {
        this.el.remove();
      }
    }
    this.isRemoved = true;
  },

  render(rootToBeRenderedTo) {
    if (this.isRendered) {
      if (this.isRemoved) {
        this.parent.appendChild(this.el);
        this.el = this.parent.lastChild;
        this.isRemoved = false;
      }
      return this;
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
        prepareState(root, attrs, key, shared),
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

function prepareState(root, attrs, key, shared) {
  return function(reduced, confItem) {
    var path;
    if (['text', 'html', 'class', 'named'].includes(confItem.type)) {
      path = confItem.path;
    } else if (confItem.type === 'attr') {
      path = attrs[confItem.attr].path;
    }
    if (path) {
      var newChild;
      var oldChild;
      var el = resolveEl(path, root);
      if (!el) {
        throw {text: 'no el resolved', info: confItem};
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
        if (TEXTNODE === undefined) {
          TEXTNODE = document.createTextNode('');
        }
        newChild = TEXTNODE.cloneNode();
        oldChild = el;
        state.el = newChild;
        reduced.childs.push([oldChild, newChild]);
      break;
      case 'class':
        if (FRAGMENT === undefined) {
          FRAGMENT = document.createDocumentFragment();
        }
        oldChild = el;
        newChild = FRAGMENT.cloneNode();
        state.el = oldChild;
        state.prevEl = newChild;
        state.isHidden = true;
        if (shared[key] !== undefined) {
          //if (shared[key] instanceof Template) {
            state.template = shared[key].render().clone().render(newChild);
          /*} else {
            state.template = shared[key];
            state.isHidden = false;
          }*/
        } else {
          throw {text: key + ' is not defined', info: {shared, key}};
        }
      break;
      case 'named':
        state.el = el;
        state.isHidden = false;
        state.prevEl = document.createComment('');
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
    resUP.text = up.value;
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
    Object.keys(update.attr).forEach(key => { update.el.setAttribute(key, update.attr[key]); });
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
  var root = TEMPLATE.cloneNode();
  root.innerHTML = strHTML;
  return root.content || templateFallback(root);
}
function templateFallback(root) {
  if (FRAGMENT === undefined) {
    FRAGMENT = document.createDocumentFragment();
  }
  var f = FRAGMENT.cloneNode(false);
  var child;
  while (child = root.firstElementChild) {
    f.appendChild(child);
  }
  return f;
}

function setState(key, value, _this) {
  return function (state) {
    if (state.prevValue !== value) {
      state.prevValue = value;
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
        if (DIV === undefined) {
          DIV = document.createElement('div');
          DIV.className = 'base-wrapper';
        }
        var newChild = DIV.cloneNode();
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
              if (isArray(v)) {
                console.error('dont know how to set array');
              } else if (isObject(v)) {
                clone.set(v);
              } else if (hidable(v)) {
                hide(clone);
              } else if (showable(v)) {
                show(clone);
              }
            });
            var targetNode;
            if (isArray(state.el) && state.el.length) {// Comment.lenght!!!
              if (state.template.el.parentNode !== null) {
                targetNode = state.template.el;
              } else if (state.el.slice(0, 1).parentNode !== null) {
                targetNode = state.el.slice(0, 1);
              } else if (state.el[0].parentNode !== null) {
                targetNode = state.el[0];
              }
            } else {
              targetNode = state.el;
            }
            if (targetNode) {
              targetNode.after(state.fragment);
              //debugger;
              //targetNode.parentNode.append(state.fragment);
            } else {
              debugger;
              //state.template.el.parentNode.append(state.fragment);
            }
          } else {
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
  if (TEXTNODE === undefined) {
    TEXTNODE = document.createTextNode('');
  }
  var newChild = state.prevEl || TEXTNODE.cloneNode();
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
    lastChild.replaceWith(newChild);
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
  if (FRAGMENT === undefined) {
    FRAGMENT = document.createDocumentFragment();
  }
  var fragment = FRAGMENT.cloneNode();
  var k = toBeCloned.root.childNodes.length;
  state.clones = [toBeCloned];
  for (var i = 1; i < valLength; i++) {
    var clone = toBeCloned.clone().render(fragment);
    clone.root = fragment.childNodes.slice((i - 1) * k);//
    state.clones.push(clone);
  }
  state.fragment = fragment;
}

function doClonedStaff(state, value) {
  var valLength = value.length;
  var clonLength = state.clones.length;
  if (clonLength > valLength) {
    state.clones.slice(valLength).forEach(tmpl => { tmpl.remove(); tmpl = null; });
  } else if (clonLength < valLength) {
    if (FRAGMENT === undefined) {
      FRAGMENT = document.createDocumentFragment();
    }
    var fragment = FRAGMENT.cloneNode();
    var toBeCloned = state.template;
    for (var i = clonLength; i <= valLength; i++) {
      var clone = toBeCloned.clone().render(fragment);
      state.clones.push(clone);
    }
    state.fragment = fragment;
  }
}

function hidable(value){
  return [false, 0, '0', null].includes(value);
}
function hide(state) {
  if (!state.isHidden) {
    togglePrevEl(state);
    state.isHidden = true;
  }
}
function showable(value){
  return [true, 1, '1'].includes(value);
}
function show(state) {
  if (state.isHidden) {
    togglePrevEl(state);
    state.isHidden = false;
  }
}

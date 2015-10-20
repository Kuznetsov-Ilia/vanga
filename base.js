var template;
var div;
var fragment;
var textNode;
import {document} from 'global';
import {isObject, isArray, isString, isFragment} from 'misc/utils';
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
    } else if (isObject(this.state.vars) && key in this.state.vars) {
      var state = this.state.vars[key];
      var setter = setItem(key, value, this);
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
    var state = this.state.vars[key];
    if (state && state[0]) {
      return state[0].instance || state[0];
    }
    else {
      console.error('unknown key', key, 'in', this.state.vars);
    }
  },

  getEl(key) {
    var state = this.state.vars[key];
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
    if (isArray(this.root)) {
      this.root.forEach(el => { el.remove(); });
    } else {
      throw {text: 'must be array', info: this.root};
    }
  },

  render(rootToBeRenderedTo) {
    if (this.isRendered) {
      return this;
    }
    var root = this.root;
    if (!root) {
      root = this.root = loadWithIframe(this.html);
    }
    var conf = this.conf;
    var shared = this.shared;
    var attrs = this.attrs;
    this.state.vars = Object.keys(conf).reduce((state, key) => {
      var a = conf[key].reduce(prepareState(root, attrs, key, shared), {childs: [], states: []});
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
      var states = {
        type: confItem.type,
        el: el
      };
      switch (confItem.type) {
      case 'attr':
        states.attr = confItem.attr;
      break;
      case 'text':
        if (textNode === undefined) {
          textNode = document.createTextNode('');
        }
        newChild = textNode.cloneNode();
        oldChild = el;
        states.el = newChild;
        reduced.childs.push([oldChild, newChild]);
      break;
      case 'class':
        if (fragment === undefined) {
          fragment = document.createDocumentFragment();
        }
        oldChild = el;
        newChild = fragment.cloneNode();
        states.el = oldChild;
        states.prevEl = newChild;
        states.isHidden = true;
        states.instance = shared[key].render().clone().render(newChild);
      break;
      case 'named':
        states.el = el;
        states.isHidden = false;
        states.prevEl = document.createComment('');
      break;
      }
      reduced.states.push(states);
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
    resUP.attr = up.opts.reduce((acc, val) => {
      acc[val.attrName] = val.tmpl.join('');
      return acc;
    }, resUP.attr || {});
  break;
  case 'text':
    resUP.text = up.value;
  break;
  case 'map':
    resUP.map = up;
  break;
  }

  result.updates[updateKey] = resUP;
  return result;
}

function doUpdates(update) {
  if (update.attr) {
    Object.keys(update.attr).forEach(key => { update.el.setAttribute(key, update.attr[key]); });
  } else if (update.text) {
    update.el.nodeValue = update.text;
  } else if (update.html) {
    var oldChild = update.html[0];
    var newChild = update.html[1];
    oldChild.replaceWith(newChild);
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
  if (template === undefined) {
    template = document.createElement('template');
  }
  var root = template.cloneNode();
  root.innerHTML = strHTML;
  return root.content || templateFallback(root);
}
function templateFallback(root) {
  if (fragment === undefined) {
    fragment = document.createDocumentFragment();
  }
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
            .map(attr => ({
              attrName: attr.name,
              tmpl: attr.keys[key].reduce((acc2, keyIndex) => {
                acc2[keyIndex] = value;
                return acc2;
              }, attr.tmpl)
            }), {})
        };
      /*break;*/
      case 'html':
        if (div === undefined) {
          div = document.createElement('div');
          div.className = 'base-wrapper';
        }
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
            targetNode.parentNode.append(item.f);
          } else {
            item.instance.set(value[0]);
          }
        } else if (isObject(value)) {
          if (item.isHidden) {
            togglePrevEl(item);
            item.isHidden = false;
          }
          item.instance.set(value);
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
        }
      break;
      case 'named':
        if ([false, 0, '0', null].includes(value)) {
          if (!item.isHidden) {
            togglePrevEl(item);
            item.isHidden = true;
          }
        } else if ([true, 1, '1'].includes(value)) {
          if (item.isHidden) {
            togglePrevEl(item);
            item.isHidden = false;
          }
        }
      break;
      }
    }
  };
}
function togglePrevEl(item) {
  var newChild = item.prevEl;
  var oldChild = item.el;
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
  item.el = newChild;
  item.prevEl = oldChild;
}

function makeClones(item, valLength, toBeCloned) {
  if (fragment === undefined) {
    fragment = document.createDocumentFragment();
  }
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
    if (fragment === undefined) {
      fragment = document.createDocumentFragment();
    }
    var f = fragment.cloneNode();
    var toBeCloned = item.instance;
    for (var i = clonLength; i <= valLength; i++) {
      var clone = toBeCloned.clone().render(f);
      item.clones.push(clone);
    }
    item.f = f;
  }
}

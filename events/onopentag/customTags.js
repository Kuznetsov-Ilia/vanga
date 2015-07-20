module.exports = function(node, parser) {
  if (node.parent) {
    var key = node.name;
    //var index = parser.subClass.indexOf(key);

    /*if (index === -1) {
      index = parser.subClass.push(node.name) - 1;
    }*/
    var condition;

    if (node.attributes.if) {
      condition = parser.getAttr(node, 'if');
    }
    
   

    
    var elConf = {
      path: node.path,
      type: 'class',
      test: condition
    };
    var a = compileAttributes(node, parser, key);
    if (a) {
      if (a.tag) {
        elConf.tag = a.tag;
      }
      if (a.attrs) {
        elConf.attrs = a.attrs;
      }
    }
    parser.elConf[key] = parser.elConf[key] || [];
    parser.elConf[key].push(elConf);
    parser.source.push('"<!--' + node.name + '-->"');
  } else {
    node.siblings = -1;
    node.path = [];
  }
};
function compileAttributes(node, parser, key) {
  var attrNames = Object.keys(node.attributes);
  var returnObj;
  if (attrNames) {
    if (node.attributes.bind) {
      parser.getAttr(node, 'bind').split(',').map(mapValue).reduce(reduceBindings, parser.bindings);
    }
    if (node.attributes.tag) {
      returnObj = returnObj || {};
      returnObj.tag = parser.getAttr(node, 'tag');
    }
    returnObj = returnObj || {};
    returnObj.attrs = attrNames
      .filter(function(attributeName){ return ['bind', 'tag'].indexOf(attributeName) === -1; })
      .map(function(attributeName) {
        return {
          name: attributeName,
          value: parser.getAttr(node, attributeName)
        };
      });
    return returnObj;
  }

  function mapValue(item){
    var trimmedVal = item.trim();
    var mapping = trimmedVal.indexOf(':') !== -1
    if (mapping) {
      splited = trimmedVal.split(':');
      return {from: splited[0], to: splited[1]};
    } else {
      return {from:trimmedVal, to:trimmedVal};
    }
  }
  function reduceBindings(bindings, val) {
    var from = val.from;
    var to = val.to;
    bindings[to] = bindings[to] || [];
    if (from === to) {
      bindings[to].push(key);
    } else {
      bindings[to].push([key, from]);
    }
    return bindings;
  }
}

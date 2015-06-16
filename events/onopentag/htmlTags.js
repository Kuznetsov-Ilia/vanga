module.exports = function (node, parser) {
  var attrs = compileAttributes(node, parser);
  var nodeHTML = '<{name}{attrs}{selfclosed}>'
    .replace('{name}', node.name)
    .replace('{attrs}', attrs)
    .replace('{selfclosed}', node.isSelfClosing ? '/' : '');

  /*if (node.conditional) {
    parser.source.push('"<!--' + node.name + '-->"');
    parser.conf[node.conditional] = parser.conf[node.conditional] || [];
    var siblings = node.parent.siblings + 1 || 0;
    var path = (node.parent.path || []).concat([siblings]);
    parser.conf[node.conditional].push({
      el: path,
      type: 'if',
      html: nodeHTML
    })
  } else {*/
    parser.source.push('"' + nodeHTML + '"');
  //}
};

function compileAttributes(node, parser) {
  var attrs = node.attributes;
  var lang = parser.lang;
  var i;
  var result = Object.keys(attrs);
  var n = 0;
  var attrsArray = [''];

  for (i in attrs) {
    var attrValue = attrs[i].value;
    /*if (i === 'if') {
      parser.ifs[attrValue] = '';
      node.conditional = attrValue;
    }*/
    var keys = (attrValue.match(/{[^}]*}/g) || []).map(sliceParenthesis);
    if (keys && keys.length) {
      var isComplex = !(keys.length === 1 && attrValue === '{' + keys[0] + '}');
      var params = {
        key: keys,
        name: i,
        isComplex: isComplex,
        el: node.path
      };
      if (isComplex) {
        params.tmpl = attrValue;
      }
      var index = parser.attr.push(params) - 1;
      keys.forEach(pushKeys(parser, index));
      attrsArray.push(i + '=\\"\\"');
    } else {
      attrsArray.push(i + '=\\"' + attrValue + '\\"');
    }
  }
  if (attrsArray.length > 1) {
    return attrsArray.join(' ');
  } else {
    return '';
  }
}

function sliceParenthesis (k) {
  return k.slice(1, -1);
}
function pushKeys(parser, index) {
  return function(key) {
    parser.elConf[key] = parser.elConf[key] || [];
    parser.elConf[key].push({type: 'attr', attr: index });
  };
}

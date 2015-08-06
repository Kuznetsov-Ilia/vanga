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
    if (i === 'as') {
      parser.elConf[attrValue] = parser.elConf[attrValue] || [];
      parser.elConf[attrValue].push({type: 'named', path: node.path });
    } else {
      var keys = (attrValue.match(/{[^}]*}/g) || []).map(sliceParenthesis);
      if (keys && keys.length) {
        var aa = keys.reduce(function(obj, key) {
          var attrStr = obj.attr;
          var start = 0;
          var result = obj.result;
          var attrKeys = obj.keys;
          var index = attrStr.indexOf('{' + key + '}');
          var length = key.length + 2;
          var stringAfter = attrStr.slice(index + length);
          var before = attrStr.slice(start, index);
          if (before) {
            result.push(before);
          }
          var keyIndex = result.push('') - 1;
          attrKeys[key] = attrKeys[key] || [];
          attrKeys[key].push(keyIndex);
          return {
            attr: stringAfter,
            result: result,
            keys: attrKeys
          };
        }, {attr: attrValue, result: [], keys: {}});
        var attrKeys = aa.keys;
        var attrArray = aa.result;
        if (aa.attr !== '') {// что-то осталось после итерации по всем ключам
          attrArray.push(aa.attr);
        }

        //var isComplex = !(keys.length === 1 && attrValue === '{' + keys[0] + '}');
        var params = {
          keys: attrKeys,
          name: i,
          tmpl: attrArray,
          //isComplex: isComplex,
          path: node.path
        };
        var index = parser.attr.push(params) - 1;
        keys.forEach(pushKeys(parser, index));

        attrsArray.push(i + '=\\"' + keys.reduce(getDefaultAttrValue, attrValue) + '\\"');

      } else {
        attrsArray.push(i + '=\\"' + attrValue + '\\"');
      }
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

function getDefaultAttrValue(attrValue, key) {
  return String(attrValue.replace('{' + key + '}', '')).trim();
}

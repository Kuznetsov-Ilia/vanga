var fs = require('fs');
var path = require('path');
var tmpl = path.join(__dirname, '../..', 'class-tmpl.js');
module.exports = function(node, parser) {
  if (node.parent) {
    if (node.attributes.from) {
      parser.imports[node.name] = parser.getAttr(node, 'from');
    }
  } else {
    parser.templates.push(getClassStr(node, parser));
  }
};

function getClassStr (node, parser) {
  var name = node.name;
  var html;
  if (parser.source.length) {
    //console.log(node.siblings);
    if (node.siblings == 0) {
      if (parser.attr && parser.attr.length) {
        parser.attr.forEach(function (a) {
          a.path.shift();
        });
      }
      (Object.keys(parser.elConf)||[]).forEach(function (key) {
        parser.elConf[key].forEach(function (p) {
          p.path && p.path.shift();
        })
      });
    } else {
      parser.source.unshift(`"<x-${name}>"`);
      parser.source.push(`"</x-${name}>"`);
    }
    //console.log(JSON.stringify(parser.elConf));
    html = parser.source.join('+').replace(/"\+"/g, '');
  } else {
    html = '""';
  }
  var conf = JSON.stringify(parser.elConf);
  var attr = JSON.stringify(parser.attr) || '[]';
  var bindings = JSON.stringify(parser.bindings);
  var exports = '';
  if (node.attributes.export) {
    if (parser.getAttr(node, 'export') === 'default') {
      //parser.exportDefault = node.name;
      exports = 'export default ' + name;
    } else {
      //parser.exports.push(node.name);
      exports = 'export {' + name + '}';
    }
  }
  parser.source = [];// html
  parser.elConf = {};
  parser.attr = [];
  parser.bindings = {};
  return fs.readFileSync(tmpl).toString()
    .replace('__EXPORT__', exports)
    .replace(/__NAME__/g, name)
    .replace('__HTML__', html)
    .replace('__CONF__', conf)
    .replace('__ATTR__', attr)
    .replace('__BIND__', bindings);
}


function obj2str(obj){
  return JSON.stringify(obj).replace(/":"/g, '":')
            .replace(/","/g, ',"')
            .replace('"}', '}')
        || '{}';
}
function arr2str(arr) {
  return '[' + String(arr).replace(/"/g, '') + ']';
}

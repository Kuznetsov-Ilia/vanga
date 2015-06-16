var fs = require('fs');
var path = require('path');
module.exports = function(node, parser) {
  if (node.parent) {
    if (node.attributes.from) {
      var name = node.name;
      var from = parser.getAttr(node, 'from');
      parser.expressions.push(
        'import {name} from \'{from}\''.replace('{name}', name).replace('{from}', from)
      );
    }
  } else {
    parser.classes.push(getClassStr(node, parser));
  }
};

function getClassStr (node, parser) {
  var html = (parser.source.join('+') || '""').replace(/"\+"/g, '');
  //var el = obj2str(parser.el);
  var subclass = arr2str(parser.subClass);
  //var subClassIndex = obj2str(parser.subClassIndex);
  var conf = JSON.stringify(parser.elConf);
  var tmpl = path.join(__dirname, '../..', 'class-tmpl.js');
  var name = node.name;
  var expressions = parser.expressions.join(';');
  var forwarding = JSON.stringify(parser.forwarding);
  //var type = JSON.stringify(parser.types) || '{}';
  var attr = JSON.stringify(parser.attr) || '[]';
  var prev = JSON.stringify(parser.types) || '{}';
  var isExport = '';
  if (node.attributes.export) {

    isExport = 'export';
    if (parser.getAttr(node, 'export') === 'default') {
      isExport += ' default';
      //isExport += '; exports[\'default\'] = ' + name;
    }

  }

  parser.expressions = [];
  parser.exprCnt = 0;
  parser.source = [];
  parser.nodeNamesStack = [];
  parser.subClass = [];
  parser.subClassIndex = {};
  parser.conf = {};
  parser.festStack = [];
  parser.types = {};
  parser.el = {};
  parser.attr = [];
  parser.elConf = {};
  parser.forwarding = {};

  return fs.readFileSync(tmpl).toString()
    .replace('__EXPORT__', isExport)
    .replace('__NAME__', name)
    .replace('__EXPR__', expressions)
    .replace('__HTML__', html)
    //.replace('__TYPE__', type)
    .replace('__CONF__', conf)
    //.replace('__EL__', el)
    .replace('__SUBCLASS__', subclass)
    //.replace('__SUBCLASS_INDEX__', subClassIndex)
    .replace('__ATTR__', attr)
    .replace('__PREV__', prev)
    .replace('__FORWARDING__', forwarding);
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

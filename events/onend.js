var path = require('path');
var fs = require('fs');
var tmpl = path.join(__dirname, '../', 'tmpl.js');

// parser stream is done, and ready to have more stuff written to it.
module.exports = function() {
  var parser = this;
  var shared = Object.keys(parser.imports).reduce(function(s, import_name) {
    if (import_name[0] === '{') {
      import_name = import_name.slice(1, -1);
    }
    if (import_name.indexOf(',') !== -1) {
      import_name.split(',').forEach(function(iname){
        var name = iname.trim();
        s[name] = name;
      });
    } else {
      s[import_name] = import_name;
    }
    return s;
  }, {});
  var importString = Object.keys(parser.imports)
    .map(i => `import ${i} from "${parser.imports[i]}"`)
    .concat(parser.importsFrom.map(i => `import '${i}'`))
    .join(';\n');

  var exportString = '';
  if (parser.exports.length) {
    exportString = 'export {' + parser.exports.join(',') + '};\n';
  }

  if (parser.exportDefault) {
    exportString = 'export default __SHARED__[\''+ parser.exportDefault + '\']';
  }
  this.output = fs.readFileSync(tmpl).toString()
    .replace('__TemplatePath__', parser.opts.path)
    .replace('__IMPORTED_SHAREDS__', obj2str(shared))
    .replace('__IMPORTS__', importString)
    .replace('__TEMPLATES__', parser.templates.join(';\n').replace(/\\\" \+/g, '" +').replace(/\+ \\\"/g, '+ "'))
    .replace('__EXPORTS__', exportString);

};


function obj2str(obj){
  return JSON.stringify(obj).replace(/":"/g, '":')
            .replace(/","/g, ',"')
            .replace('"}', '}')
        || '{}';
}

exports.__esModule = true;

exports.default = function (options) {
  var filter = (0, _rollupPluginutils.createFilter)(options.include, options.exclude);
  return {
    transform: function transform(source, id) {
      if (!filter(id)) return;
      var code = 'export default function(){}';
      try {
        options.path = 'vanga/base.es6.js';
        var parser = new Parser(options);
        parser.write('<xml>' + source + '</xml>', id);
        code = parser.getString();
      } catch (e) {
        console.error('error in parser', e.stack);
      }
      return { code: code };
    }
  };
};

var _rollupPluginutils = require('rollup-pluginutils');

var Parser = require('./parser.js');

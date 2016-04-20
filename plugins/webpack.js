var Parser = require('../parser.js');
module.exports = function(source) {
  this.cacheable && this.cacheable();
  var parser = new Parser();
  parser.write('<xml>' + source + '</xml>', '');
  return parser.getSource();
};

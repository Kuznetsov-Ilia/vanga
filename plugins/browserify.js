var Parser = require('./parser.js');
var through = require('through');

module.exports = function (fileName, options) {
  if (!/\.xml$/i.test(fileName)) {
    return through();
  }
  //console.log(fileName);
  var data = '';
  var parser = new Parser();
  return through(write, end);
  function write(buf) {
    data += buf
  }
  function end() {
    var result;
    try {
      parser.write('<xml>' + data + '</xml>', fileName);
      result = parser.getSource();
    } catch (e) {
      console.log(e.stack);
      this.emit("error", e);
      return;
    }
    this.queue(result);
    this.queue(null);
  }
};

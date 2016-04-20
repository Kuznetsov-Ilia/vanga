const PLUGIN_NAME = 'gulp-fest-hardcore';
var through = require('through2');
var gutil = require('gulp-util');
var PluginError = gutil.PluginError;
var Parser = require('./parser.js');
var fs = require('fs');

module.exports = function (options) {
  var stream = through.obj(function (file, enc, callback) {
    if (file.isNull()) {
      this.emit('error', new PluginError(PLUGIN_NAME, 'Null not supported!'));
      this.push(file);
      return callback();
    }
    if (file.isBuffer()) {
      var parser = new Parser(options);
      var source = file.contents.toString('utf8');
      parser.write('<xml>' + source + '</xml>', file.path);
      file.contents = parser.getSource();
      this.push(file);
      return callback();
    }
    if (file.isStream()) {
      // this.emit('error', new PluginError(PLUGIN_NAME, 'Streams not supported!'));
      /*log('Stream mode');

      file.contents = file.contents.pipe(Parser());*/
      this.push(file);
      return callback();
    }
  });
  return stream;
}

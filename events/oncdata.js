module.exports = function(text) {
  var parser = this;
  if (parser.lang == 'Xslate') {
    parser.source.push(text);
  } else {
    parser.source.push('"' + parser.escapeJS(text) + '"');
  }
}

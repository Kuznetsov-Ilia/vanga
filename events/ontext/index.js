module.exports = function (text) {
  var parser = this;
  var path = parser.parent.path;
  var siblings = parser.parent.siblings + 1 || 0;
  var replaceWithComments = function (str, match) {
    return str.replace(match, '<!--' + match + '-->');
  };
  var getChildNodes = function (str, match) {
    var key = match.slice(1, -1);
    var type;
    if (key.indexOf('|html') !== -1) {
      key = key.replace('|html', '');
      type = 'html';
    } else {
      type = 'text';
    }
    if (str.indexOf(match) !== 0) {
      siblings++;
    }
    var pos = path.concat([siblings]);
    if (str.indexOf(match) !== str.length - match.length) {
      siblings++;
    }
    parser.elConf[key] = parser.elConf[key] || [];
    parser.elConf[key].push({ type: type, path: parser.arrayToPath(pos) });
    return str.replace(match, '');
  };
  
  var match = text.match(/\{[\w\d\|]+\}/gi);
  if (match && match.length) {
    match.reduce(getChildNodes, text);
    text = match.reduce(replaceWithComments, text);
  }
  parser.parent.siblings = siblings;
  parser.source.push('"' + parser.escapeJS(text) + '"');
};

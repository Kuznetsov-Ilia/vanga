module.exports = function (text) {
  var parser = this;
  switch (parser.nodeNamesStack[parser.nodeNamesStack.length - 1]) {
  default:
    //var types = parser.types;
    //var el = parser.el;

    //console.log(parser.parent.name, parser.parent.path, text);
    var path = parser.parent.path;
   // console.log(parser.parent.siblings);
    //console.log('ontext:before', parser.parent.name, parser.parent.siblings);
    var siblings = parser.parent.siblings + 1 || 0;
    var replaceWithComments = function(text, match) {
      return text.replace(match, '<!--' + match + '-->');
    };
    var getChildNodes = function(text, match) {
      var key = match.slice(1, -1);
      var type;
      if (key.indexOf('|html') !== -1) {
        key = key.replace('|html', '');
        type = 'html';
      } else {
        type = 'text';
      }
      if (text.indexOf(match) !== 0) {
        siblings++;
      }
      var pos = path.concat([siblings]);
      //console.log(match, pos);
      /*if (match == '{moder|html}') {
        console.log(text, match)
        console.log(text.indexOf(match), text.length - match.length);
        console.log(siblings);
      }*/
      if (text.indexOf(match) !== text.length - match.length) {
        siblings++;
      }
      parser.elConf[key] = parser.elConf[key] || [];
      parser.elConf[key].push({ type: type, path: parser.arrayToPath(pos) });
      return text.replace(match, '');
    };
    //console.log(text);
    var match = text.match(/\{[\w\d\|]+\}/gi);
    if (match && match.length) {
      match.reduce(getChildNodes, text);
      text = match.reduce(replaceWithComments, text);
      //console.log('ontext:after', parser.parent.name, parser.parent.siblings);

    }
    parser.parent.siblings = siblings;
    parser.source.push('"' + parser.escapeJS(text) + '"');
    break;
  }
};

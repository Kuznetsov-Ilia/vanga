module.exports = function(node, parser) {
  if (node.parent) {
    var key = node.name;
    var index = parser.subClass.indexOf(key);

    if (index === -1) {
      index = parser.subClass.push(node.name) - 1;
    }
    var condition;

    if (node.attributes.if) {
      condition = parser.getAttr(node, 'if');
    }
    parser.elConf[key] = parser.elConf[key] || [];
    var keyIndex = parser.elConf[key].push({
      el: node.path,
      type: 'class',
      sub: index,
      test: condition
    }) - 1;
    if (node.attributes.if) {
      parser.elConf[condition] = parser.elConf[condition] || [];
      parser.elConf[condition].push({
        type: 'if',
        sub: key,
        index: keyIndex
      });
    }
    compileAttributes(node, parser, keyIndex);
    parser.source.push('"<!--' + node.name + '-->"');
  } else {
    node.siblings = -1;
    node.path = [];
  }
};
function compileAttributes(node, parser, keyIndex) {
  for (var i in node.attributes) {
    if (['if', 'from'].indexOf(i) !== -1) {
      continue;//reserved
    } else {
      var from = node.attributes[i].value;
      var to = i;
      parser.forwarding[from] = parser.forwarding[from] || [];
      parser.forwarding[from].push({
        sub: keyIndex,
        key: to
      });
    }
  }
}

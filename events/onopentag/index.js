module.exports = function (node) {
  if (node.local === 'xml') {
    return;
  }
  var parser = this;
  parser.nodeNamesStack.push(node.local);
  node.parent = parser.parent;
  if (node.parent) {
    node.parent.siblings = node.parent.siblings + 1 || 0;
    node.path = (node.parent.path || []).concat([node.parent.siblings]);
  } else {
    node.siblings = 0;
    node.path = [0];
  }
  parser.parent = node;
  //console.log(node.local, node.path);
  if (parser.festTags.indexOf(node.local) !== -1) {
    parser.festStack.push(node);
    require('./festTags')(node, parser);
  } else if (parser.htmlTags.indexOf(node.local) !== -1) {
    require('./htmlTags')(node, parser);
  } else {
    require('./customTags')(node, parser);
  }
};

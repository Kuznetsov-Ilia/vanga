module.exports = function () {
  var node = this.tag;
  var parser = this;
  if (node.local === 'xml') {
    return;
  }
  //console.log('close', node.local, node.path);
  if (node.parent) {
    //node.parent.siblings = node.parent.siblings + 1 || 0;
  } else {
    
  }
  parser.parent = node.parent;
  if (this.festTags.indexOf(node.local) !== -1) {
    require('./festTags')(node, this);
  } else if (this.htmlTags.indexOf(node.local) !== -1) {
    require('./htmlTags')(node, this);
  } else {
    require('./customTags')(node, this);
  }
};

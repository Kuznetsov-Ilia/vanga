var shortTags = {
  area: true,
  base: true,
  br: true,
  col: true,
  command: true,
  embed: true,
  hr: true,
  img: true,
  input: true,
  keygen: true,
  link: true,
  meta: true,
  param: true,
  source: true,
  wbr: true
};


module.exports = function(node, parser) {
  parser.nodeNamesStack.pop();
  if (!(node.name in shortTags)) {
    if (parser.lang === 'Xslate') {
      parser.source.push('</#>'.replace('#', node.name));
    } else {
      parser.source.push('"</#>"'.replace('#', node.name));
    }
  }
};


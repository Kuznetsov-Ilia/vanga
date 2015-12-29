module.exports = function(node, parser){
  switch (node.local) {
  case 'doctype':
    if (parser.lang == 'Xslate') {
      parser.source.push('<!DOCTYPE ');
    } else {
      parser.source.push('"<!DOCTYPE "');
    }
    return;
  case 'comment':
    if (parser.lang == 'Xslate') {
      parser.source.push('<!--');
    } else {
      parser.source.push('"<!--"');
    }
    return;
  case 'cdata':
    if (parser.lang == 'Xslate') {
      parser.source.push('<![CDATA[');
    } else {
      parser.source.push('"<![CDATA["');
    }
    return;
  case 'n':
    if (parser.lang == 'Xslate') {
      parser.source.push('\n');
    } else {
      parser.source.push('"\n"');
    }
    return;
  case 'space':
    if (parser.lang == 'Xslate') {
      parser.source.push(' ');
    } else {
      parser.source.push('" "');
    }
    return;
  case 'switch':
  case 'case':
  case 'default':
  case 'for':
  case 'if':
  case 'elseif':
  case 'else':
  case 'set':
  case 'get':
  case 'require':
  case 'only':
  case 'js':
  case 'lua':
  case 'xslate':
    openScope(parser, node);
    return;
  case 'value':
    if (parser.lang == 'Xslate') {
      parser.source.push('<: ');
    } else {
      if (node.attributes.escape) {
        switch (node.attributes.escape.value) {
        case 'html':
          if (parser.lang === 'lua') {
            parser.source.push('U.escapeHTML(""');
          } else {
            parser.source.push('ESCAPE_HTML(""');
          }
          break;
        case 'js':
          if (parser.lang === 'lua') {
            parser.source.push('U.parser.escapeJS(""');
          } else {
            parser.source.push('ESCAPE_JS(""');
          }
          break;
        case 'json':
          log('escape json is not implemented');
          if (parser.lang === 'lua') {
            parser.source.push('U.parser.escapeJSON(""');
          } else {
            parser.source.push('ESCAPE_JSON(""');
          }
          break;
        }
      }
    }
    return;
  case 'insert':
    if (node.attributes.src) {
      var path = [dirname(parser.filepath), '/', parser.getAttr(node, 'src')].join('');
      var content = parser.escapeJS(fs.readFileSync(path).toString());
      parser.source.push('"' + content + '"');
    } else {
      log('insert must have src attribute');
    }
    return;
  case 'include':
    log('include isnot implemented. use insert or get or require, Luke');
    return;
  case 'var':
    log('var isnot implemented. use vars, Luke');
    return;
  case 'vars':
    var vars = [];
    for (var i in node.attributes) {
      if (node.attributes[i].value === '') {
        vars.push(node.attributes[i].value)
      } else {
        vars.push('{name}={value}'
          .replace('{name}', i)
          .replace('{value}', node.attributes[i].value)
        );
      }
    }
    if (parser.lang === 'lua') {
      parser.expressions.push('local {vars};'
        .replace('{vars}', vars.join(','))
      );
    } else if (parser.lang == 'Xslate') {
      parser.source.push(
        '<:my {vars} :>'.replace('{vars}', vars.join(','))
      );
    } else {
      parser.expressions.push('var {vars};'
        .replace('{vars}', vars.join(','))
      );
    }
    return;
  case 'param':
    var value = '';
    if (node.attributes.value) {
      value = parser.getAttr(node, 'value', 'var');
    } else if (node.attributes.select) {
      value = '(' + parser.getAttr(node, 'select', 'expr') + ')';
    }

    if (value) {
      parser.source.push(
        (parser.source.pop() || '') +
        '__params#__.{name} = {value};'.replace('#', parser.parent.exprCnt).replace('{name}', node.attributes.name.value).replace('{value}', value)
      );
    } else {
      parser.source.push(
        parser.source.pop() || '' +
        ';__params#__.{name} = ""'.replace('#', parser.parent.exprCnt).replace('{name}', node.attributes.name.value)
      );
    }
    return;

  case 'template':
    if (node.attributes.name) {
      var path = parser.getAttr(node, 'path');
      var name = parser.getAttr(node, 'name');
      parser.expressions.push(
        'import {name} from \'{path}\';'
        .replace('{name}', name)
        .replace('{path}', path)
      );
      parser.source.push('"<!--' + name + '-->"');
      parser.keys[name] = 'class';
      parser.el[name] = node.path;
    }
    return;
  case 'continue':
  case 'break':
  case 'return':
    parser.expressions.push(node.local + ';\n');
    return;
  case 'log':
    parser.expressions.push('console.log(');
    return;
  
  case 'import':
    if (node.attributes.name && node.attributes.from) {
      var name = parser.getAttr(node, 'name');
      var from = parser.getAttr(node, 'from');
      parser.imports[name] = from;
      /*var imports = {};
      var importDefault = node.attributes.default;// && node.attributes.default.value;
      for (var name in node.attributes) {
        if (name !== 'default') {
          imports[importDefault ? name : '{'+name+'}'] = node.attributes[name].value;
        }
      }
      extend(parser.imports, imports);*/
    } else if (node.attributes.from) {
      var from = parser.getAttr(node, 'from');
      parser.importsFrom.push(from);
    }
    return;
  
  case 'export':
    if (node.attributes) {
      parser.exports = parser.exports.concat(Object.keys(node.attributes));
    }
    return;

  }
}

function extend (original, extended) {
  extended = extended || {};
  for (var key in extended) {
    original[key] = extended[key];
  }
  return original;
}

function openScope(parser, node) {
  switch (node.local) {
  case 'else':
  case 'elseif':
    node.exprCnt = parser.prevClosed.exprCnt;
    break;
  case 'case':
  case 'default':
    node.exprCnt = parser.parent.exprCnt;
    break;
  case 'if':
  case 'for':
  case 'switch':
    node.exprCnt = parser.exprCnt;
    parser.exprCnt++;
    if (parser.lang != 'Xslate') {
      parser.source.push('__expr#__'.replace('#', node.exprCnt));
    }
    break;
  case 'get':
  case 'require':
  case 'only':
  case 'js':
  case 'lua':
  case 'xslate':
    node.exprCnt = parser.exprCnt;
    parser.exprCnt++;
    break;
  }
  node.expressions = parser.expressions;
  node.source = parser.source;
  node.parent = parser.parent;
  parser.expressions = [];
  parser.source = [];
  parser.parent = node;
  parser.prevOpened = node;
}


function dirname(path) {
  return path.substring(0, path.lastIndexOf('/'));
}

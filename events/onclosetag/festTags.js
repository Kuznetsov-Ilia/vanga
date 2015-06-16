module.exports = function(node, parser){
  parser.festStack.pop();
  switch (node.local) {
  case 'doctype':
    if (parser.lang == 'Xslate') {
      parser.source.push('>');
    } else {
      parser.source.push('">"');
    }
    return;
  case 'comment':
    if (parser.lang == 'Xslate') {
      parser.source.push('-->');
    } else {
      parser.source.push('"-->"');
    }
    return;
  case 'cdata':
    if (parser.lang == 'Xslate') {
      parser.source.push(']]>');
    } else {
      parser.source.push('"]]>"');
    }
    return;
  case 'for':
    closeScope(parser, node);
    var list;
    var value;
    var forin = false;
    if (node.attributes.iterate) {
      list = parser.getAttr(node, 'iterate', 'expr');
    } else if (node.attributes.in) {
      list = parser.getAttr(node, 'in', 'expr');
      forin = true;
    } else if (node.attributes.of) {
      list = parser.getAttr(node, 'of', 'expr');
    } else {
      throw {message: 'nothing to iterate: attribute `in`, `of`, `iterate` must be set'}
    }
    if (node.attributes.value) {
      value = parser.getAttr(node, 'value');
    } else if (node.attributes.val) {
      value = parser.getAttr(node, 'val');
    } else if (node.attributes.v) {
      value = parser.getAttr(node, 'v');
    } else if (forin) {
      // var at "for in" is index
    } else if (node.attributes.var) {
      value = parser.getAttr(node, 'var');
    }
    var i = '_i_' + value;
    if (node.attributes.index) {
      i = parser.getAttr(node, 'index', 'var');
    } else if (forin && node.attributes.var) {
      i = parser.getAttr(node, 'var');
    }
    if (parser.lang === 'lua') {
      var expr = node.innerExpressions.join('\n') || '';
      var source = node.innerSource.join('..') || '""';
      parser.expressions.push(
        'local __expr#__ = ""\n                         \n'.replace('#', node.exprCnt) +
        'if {list} and next({list}) then\n              \n'.replace(/\{list\}/g, list) +
        '  __expr#__ = {}\n                             \n'.replace('#', node.exprCnt) +
        '  for {i}, {value} in ipairs({list}) do\n      \n'.replace('{i}', i).replace('{value}', value).replace('{list}', list) +
        '    {expressions}\n                            \n'.replace('{expressions}', expr) +
        '    table.insert(__expr#__, {source})\n        \n'.replace('#', node.exprCnt).replace('{source}', source) +
        '  end\n' +
        '  __expr#__ = table.concat(__expr#__)\n        \n'.replace(/#/g, node.exprCnt) +
        'end\n'
      );
    } else if (parser.lang == 'Xslate') {
      parser.source.push(
        '<: if ${list}[0] {:>'                .replace('{list}', list) +
          '<: for ${list}->${value} {:>'      .replace('{list}', list).replace('{value}', value) +
            '<: my ${index} = $~{value}; :>'  .replace('{index}', i).replace('{value}', value) +
              (node.innerExpressions          .join(';') || '') +
              (node.innerSource               .join('') || '') +
          '<: }:>' +
        '<: }:>'
      );
    } else {
      var expr = node.innerExpressions.join(';') || '';
      var source = node.innerSource.join('+') || '""';

      parser.expressions.push(
        'var __expr#__ = "";                            '.replace('#', node.exprCnt) +
    (forin
      ? 'for (var {i} in {list}) {                      '.replace('{i}', i).replace('{list}', list)
      : 'if ( {list} && {list}.length ) {               '.replace(/\{list\}/g, list) +
        '  for (var {i} = 0, {i}l = {list}.length; {i} < {i}l ; {i}++) {'.replace('{list}', list).replace(/\{i\}/g, i)
    ) +
        '    var {value} = {list}[{i}];                 '.replace('{list}', list).replace('{i}', i).replace('{value}', value) +
        '    {expressions}                              '.replace('{expressions}', expr) +
        '    __expr#__ += {source}                      '.replace('#', node.exprCnt).replace('{source}', source) +
        '  }' +
        (forin
          ? ''
          : '}'
        )
      )
    }
    return;
  case 'switch':
    closeScope(parser, node);
    var test = parser.getAttr(node, 'test', 'expr');
    if (parser.lang === 'lua') {
      var expressions = node.innerExpressions.join('\n') || '';
      var source = node.innerSource.join('..') || '';
      parser.expressions.push(
        'local __expr#__ = ""\n                            \n'.replace('#', node.exprCnt) +
        'local __test#__ = {test}\n                        \n'.replace('#', node.exprCnt).replace('{test}', test) +
        '{expressions}\n                                   \n'.replace('{expressions}', expressions) +
        '{source}\n                                        \n'.replace('{source}', source)
      );
    } else if (parser.lang === 'Xslate') {
      
    } else {
      var expressions = node.innerExpressions.join(';') || '';
      var source = node.innerSource.join('+') || '';
      parser.expressions.push(
        'var __expr#__ = "";                              '.replace('#', node.exprCnt) +
        'switch ({test}) {                                '.replace('{test}', test) +
        '  {expressions}                                  '.replace('{expressions}', expressions) +
        '  {source}                                       '.replace('{source}', source) +
        '}'
      );
    }
    return;
  case 'case':
    closeScope(parser, node);
    if (node.attributes.is) {
      var val = parser.getAttr(node, 'is', 'expr');
    } else if (node.attributes.any) {
      var vals = parser.getAttr(node, 'any').split('|');
    }
    var nobreak = node.attributes.nobreak;
    if (parser.lang === 'lua') {
      var expressions = node.innerExpressions.join('\n') || '';
      var source = node.innerSource.join('..') || '""';
      var prevExpr = parser.expressions.pop() || '';
      var token;
      if (prevExpr.slice(-4) === 'end\n') {
        prevExpr = prevExpr.slice(0, -4);
        token = 'elseif';
      } else {
        token = 'if';
      }
      parser.expressions.push(
        prevExpr +
        '{token} __test#__ == {val} then\n      \n'.replace('{token}', token).replace('#', node.exprCnt).replace('{val}', val) +
        '  {expressions}\n                  \n'.replace('{expressions}', expressions) +
        '  __expr#__ = {source}\n               \n'.replace('#', node.exprCnt).replace('{source}', source) +
        'end\n'
      );
    } else if (parser.lang === 'Xslate') {

    } else {
      var _case = '';
      if (node.attributes.is) {
        _case = 'case ' + val + ':';
      } else if (node.attributes.any) {
        var cases = [];
        vals.forEach(function(val) {
          cases.push('case ' + val + ':');
        });
        _case = cases.join('\n');
      }
      var expressions = node.innerExpressions.join(';') || '';
      var source = node.innerSource.join('+') || '""';
      parser.expressions.push(
        (parser.expressions.pop() || '') +
        '#case                              '.replace('#case', _case) +
        '  {expressions}                    '.replace('{expressions}', expressions) +
        '  __expr#__ = {source};            '.replace('#', node.exprCnt).replace('{source}', source) +
        'break;                             '.replace('break', nobreak ? '' : 'break')
      );
    }
    return;
  case 'default':
    closeScope(parser, node);
    if (parser.lang === 'lua') {
      var expressions = node.innerExpressions.join('\n') || '';
      var source = node.innerSource.join('..') || '""';
      var prevExpr = parser.expressions.pop() || '';
      if (prevExpr.slice(-4) === 'end\n') {
        prevExpr = prevExpr.slice(0, -4);
      }
      parser.expressions.push(
        prevExpr +
        'else\n' +
        '  {expressions}\n                   \n'.replace('{expressions}', expressions) +
        '  __expr#__ = {source}\n                \n'.replace('#', node.exprCnt).replace('{source}', source) +
        'end\n'
      );
    } else if (parser.lang == 'Xslate') {
    } else {
      var expressions = node.innerExpressions.join(';') || '';
      var source = node.innerSource.join('+') || '""';
      parser.expressions.push(
        (parser.expressions.pop() || '') +
        'default: ' +
        '  {expressions}                        '.replace('{expressions}', expressions) +
        '  __expr#__ = {source};                    '.replace('#', node.exprCnt).replace('{source}', source) +
        'break;'
      );
    }
    return;

  case 'if':
    closeScope(parser, node);
    var test, not = false;
    if (node.attributes.test) {
      test = parser.getAttr(node, 'test', 'expr');
    } else if (node.attributes.not) {
      test = parser.getAttr(node, 'not', 'expr');
      not = true;
    }
    if (parser.lang === 'lua') {
      var expressions = node.innerExpressions.join('\n') || '';
      var source = node.innerSource.join('..') || '""';
      parser.expressions.push(
        'local __expr#__ = ""\n                             \n'.replace('#', node.exprCnt) +
        'if {test} then\n                                   \n'.replace('{test}', test) +
        '  {expressions}\n                                  \n'.replace('{expressions}', expressions) +
        '  __expr#__ = {source}\n                           \n'.replace('#', node.exprCnt).replace('{source}', source) +
        'end\n'
      );
    } else if (parser.lang == 'Xslate') {
      parser.source.push(
        '<: if ({not}${test}) {:>'                          .replace('{not}', not ? '!' : '')
                                                            .replace('{test}', test) +
            (node.innerExpressions.join(';') || '') +
            (node.innerSource.join('') || '') +
        '<: }:>'
      );
    } else {
      var expressions = node.innerExpressions.join(';') || '';
      var source = node.innerSource.join('+') || '""';
      parser.expressions.push(
        'var __expr#__ = "";                                '.replace('#', node.exprCnt) +
        'if ({test}) {                                      '.replace('{test}', test) +
        '  {expressions}                                    '.replace('{expressions}', expressions) +
        '  __expr#__ = {source}                             '.replace('#', node.exprCnt).replace('{source}', source) +
        '}'
      );
    }
    return;
  case 'elseif':
    closeScope(parser, node);
    var test = parser.getAttr(node, 'test', 'expr');
    if (parser.lang === 'lua') {
      var expressions = node.innerExpressions.join('\n') || '';
      var source = node.innerSource.join('..') || '""';
      var prevExpr = parser.expressions.pop() || '';
      if (prevExpr.slice(-4) === 'end\n') {
        prevExpr = prevExpr.slice(0, -4);
      }
      parser.expressions.push(
        prevExpr +
        'elseif {test} then\n                 \n'.replace('{test}', test) +
        '  {expressions}\n                    \n'.replace('{expressions}', expressions) +
        '  __expr#__ = {source}\n             \n'.replace('#', node.exprCnt).replace('{source}', source) +
        'end\n'
      );
    } else if (parser.lang == 'Xslate') {
      parser.source.push(
        (parser.source.pop().slice(0, -2) || '') +
        ' else if (${test}) {:>'                 .replace('{test}', test) +
            (node.innerExpressions.join(';') || '') +
            (node.innerSource.join('') || '') +
        '<: }:>'
      );
    } else {
      var expressions = node.innerExpressions.join(';') || '';
      var source = node.innerSource.join('+') || '""';
      parser.expressions.push(
        (parser.expressions.pop() || '') +
        'else if ({test}) {                   '.replace('{test}', test) +
        '  {expressions}                      '.replace('{expressions}', expressions) +
        '  __expr#__ = {source}               '.replace('#', node.exprCnt).replace('{source}', source) +
        '}'
      );
    }

    return;
  case 'else':
    closeScope(parser, node);
    if (parser.lang === 'lua') {
      var expressions = node.innerExpressions.join('\n') || '';
      var source = node.innerSource.join('..') || '""';
      var prevExpr = parser.expressions.pop() || '';
      if (prevExpr.slice(-4) === 'end\n') {
        prevExpr = prevExpr.slice(0, -4);
      }
      parser.expressions.push(
        prevExpr +
        'else\n' +
        '  {expressions}\n                      \n'.replace('{expressions}', expressions) +
        '  __expr#__ = {source}\n               \n'.replace('#', node.exprCnt).replace('{source}', source) +
        'end\n'
      );
    } else if (parser.lang == 'Xslate') {
      parser.source.push(
        (parser.source.pop().slice(0, -2) || '') +
        ' else {:>' +
            (node.innerExpressions.join(';') || '') +
            (node.innerSource.join('') || '') +
        '<: }:>'
      );
    } else {
      var expressions = node.innerExpressions.join(';') || '';
      var source = node.innerSource.join('+') || '""';
      parser.expressions.push(
        (parser.expressions.pop() || '') +
        'else {' +
        '  {expressions}                        '.replace('{expressions}', expressions) +
        '  __expr#__ = {source}                 '.replace('#', node.exprCnt).replace('{source}', source) +
        '}'
      );
    }
    return;
  case 'value':
    if (parser.lang == 'Xslate') {
      var escape = ' | raw';
      if (node.attributes.escape) {
        escape = '';
      }
      parser.source.push((parser.source.pop() || '') + escape + ' :>');
    } else {
      if (node.attributes.escape) {
        switch (node.attributes.escape.value) {
        case 'html':
        case 'js':
        case 'json':
          parser.source.push(
            (parser.source.pop() || '') +
            ')'
          );
          break;
        }
      }
    }
    return;
  case 'set':
    closeScope(parser, node);
    var name;
    if (node.attributes.name) {
      name = parser.getAttr(node, 'name');
    } else if (node.attributes.select) {
      name = parser.getAttr(node, 'select', 'expr');
    }
    if (parser.lang === 'lua') {
      var expressions = node.innerExpressions.join('\n') || '';
      var source = node.innerSource.join('..') || '""';
      parser.expressions.push(
        'function {name} ({params})           '.replace('{name}', name).replace('{params}', node.attributes.params ? node.attributes.params.value : 'params') +
        '  {expressions}                      '.replace('{expressions}', expressions) +
        '  return {source}                    '.replace('{source}', source) +
        'end'
      );
    } else {
      var expressions = node.innerExpressions.join(';') || '';
      var source = node.innerSource.join('+') || '""';
      parser.expressions.push(
        'function {name} ({params}){          '.replace('{name}', name).replace('{params}', node.attributes.params ? node.attributes.params.value : 'params') +
        '  {expressions}                      '.replace('{expressions}', expressions) +
        '  return {source}                    '.replace('{source}', source) +
        '}'
      );
    }
    return;
  case 'get':
    closeScope(parser, node);
    var name;
    if (node.attributes.name) {
      name = parser.getAttr(node, 'name');
    } else if (node.attributes.select) {
      name = '__expr#__'.replace('#', node.exprCnt);
      if (parser.lang === 'lua') {
        parser.expressions.push('local ' + name + '=' + parser.getAttr(node, 'select', 'expr'));
      } else {
        parser.expressions.push('var ' + name + '=' + parser.getAttr(node, 'select', 'expr'));
      }
    }
    if (parser.lang === 'lua') {
      var expressions = node.innerExpressions.join('\n') || '';
      var source = node.innerSource.join('..') || '';
      parser.expressions.push(
        'local __params#__ = {params}                 '.replace('#', node.exprCnt).replace('{params}', node.attributes.params ? parser.getAttr(node, 'params') : '{}')
      );
    } else {
      var expressions = node.innerExpressions.join(';') || '';
      var source = node.innerSource.join('+') || '';
      parser.expressions.push(
        'var __params#__ = {params};                 '.replace('#', node.exprCnt).replace('{params}', node.attributes.params ? parser.getAttr(node, 'params') : '{}')
      );
    }
    if (expressions) {
      parser.expressions.push(expressions);
    }
    if (source) {
      parser.expressions.push(source);
    }
    parser.source.push(
      '{name}(__params#__)                        '.replace('{name}', name).replace('#', node.exprCnt)
    );
    return;
  case 'require':
    closeScope(parser, node);
    var name;
    if (node.attributes.name) {
      if (parser.lang === 'lua') {
        name = '"templates.' + parser.getAttr(node, 'name') + '"';
      } else if (parser.lang == 'Xslate') {
        name = parser.getAttr(node, 'name');
      } else {
        name = '"' + parser.getAttr(node, 'name') + '"';
      }
    } else if (node.attributes.select) {
      if (parser.lang === 'lua') {
        name = '"templates."..' + parser.getAttr(node, 'select', 'expr');
      } else if (parser.lang == 'Xslate') {
        name = parser.getAttr(node, 'select', 'expr');
      } else {
        name = parser.getAttr(node, 'select', 'expr');
      }
    }
    if (parser.lang === 'lua') {
      var expressions = node.innerExpressions.join('\n') || '';
      var source = node.innerSource.join('..') || '';
      parser.expressions.push('local __params#__ = {params}               '.replace('#', node.exprCnt).replace('{params}', node.attributes.params ? parser.getAttr(node, 'params') : '{}'))
    } else if (parser.lang == 'Xslate') {

    } else {
      var expressions = node.innerExpressions.join(';') || '';
      var source = node.innerSource.join('+') || '';
      parser.expressions.push('var __params#__ = {params};               '.replace('#', node.exprCnt).replace('{params}', node.attributes.params ? parser.getAttr(node, 'params') : '{}'))
    }
    if (expressions) {
      parser.expressions.push(expressions);
    }
    if (source) {
      parser.expressions.push(source);
    }
    if (parser.lang == 'Xslate') {
      var params = '';
      if (node.attributes.params) {
        var _params = parser.getAttr(node, 'params');
        if (_params.substr(0, 1) == '{') {
          params = _params + ';';
        } else {
          params = ' { $' + _params + ' };';
        }
      } else if (node.attributes['param1-name']) {
        var i = 1;
        var key;
        params = [];
        while (node.attributes['param'+i+'-name']) {
          key = parser.getAttr(node, 'param'+i+'-name');
          value = parser.getAttr(node, 'param'+i+'-value');
          params.push(key + ' => $' + value);
          i++;
        }
        if (params.length > 0) {
          params = ' { ' + params.join(',') + ' }';
        } else {
          params = '';
        }
      }
      var namespace = parser.defaults.requireNamespace;
      if (node.attributes.namespace) {
        namespace = parser.getAttr(node, 'namespace');
      }
      parser.source.push(
        '<: include {namespace}::{name}{params}; :>'
            .replace('{namespace}', namespace)
            .replace('{name}', name)
            .replace('{params}', params)
      );
    } else {
      parser.source.push(
        'FEST_TEMPLATES[{name}](__params#__)                                 '.replace('{name}', name).replace('#', node.exprCnt)
      );
    }
    break;
  case 'log':
    parser.expressions.push(parser.expressions.pop() + ');');
    return;
  case 'only':
  case 'js':
  case 'lua':
  case 'xslate':
    closeScope(parser, node);
    var lang;
    if (node.attributes.for) {
      lang = parser.getAttr(node, 'for');
    } else {
      lang = node.local;
    }
    if (parser.lang == lang) {
      if (node.innerExpressions && node.innerExpressions.length) {
        var innerExpressions = node.innerExpressions.join('');
        if (innerExpressions) {
          parser.expressions.push(innerExpressions);
        }
      }
      if (node.innerSource && node.innerSource.length) {
        var innerSource = node.innerSource.join(parser.CONCAT);
        if (innerSource) {
          parser.source.push(innerSource);
        }
      }
    }
    return;
  case 'text':
    //nodes.push('{}')
    return;
  }
}



function closeScope(parser, node) {
  node.innerSource = parser.source;
  node.innerExpressions = parser.expressions;
  parser.source = node.source;
  parser.expressions = node.expressions;
  parser.parent = node.parent;
  parser.prevClosed = node;
}

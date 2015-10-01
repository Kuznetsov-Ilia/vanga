import {
  jsdom
}
from 'jsdom';
import it from 'tape';
import {
  set
}
from 'global';
var log = console.log;
var document = jsdom('<html><body></body></html>');
var window = document.defaultView;
var body = document.body;
set({ window, document, body});
require('misc/dom4');

it('should bind text', (t) => {
  t.plan(1);
  var { el, template } = load('../build/simpleText');
  var expectedText = 'some text';
  template.set('textvar', expectedText);
  t.equal(expectedText, el.textContent);
});
it('should bind html with content', (t) => {
  t.plan(2);
  var {el, template} = load('../build/simpleHtml');
  template.set('htmlvar', '<a>some link</a>');
  var a = el.querySelector('a');
  t.equal('a', a.tagName.toLowerCase());
  t.equal('some link', a.textContent);
});
it('should bind attributes', (t) => {
  t.plan(1);
  var { el, template} = load('../build/simpleAttributes');
  var values = {
    action: 'mark',
    clear: '',
    clb: 'clb3187965',
    my: 0,
    type: 'question',
    state: 'R',
    refname: 'qid',
    canmark: 1,
    totalmarks: 2,
    Totalmarks: true,
    iClassName: ''
  };
  template.set(values);
  t.equal(el.getAttribute('class'), 'mark  action--mark action--need-auth test2');
});
/*it('should bind component', (t) => {
  t.plan(1);
  var {
    el, template
  } = load('../build/simpleComponents');
  template.set('component1', true);
  console.log(template.get('component1'));
  t.equal('I am an component 1!', el.querySelector('h1').textContent);
});*/

function load(tmlpName) {
  body.innerHTML = '';
  var template = require(tmlpName);
  template.render(body);
  var el = body.childNodes[0];
  return {
    el, template
  };
}

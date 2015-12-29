import { body} from 'global';
import 'misc/polyfills';
import 'misc/dom';
//import 'misc/dom4';
import it from 'tape';

/*
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


it('should import vars, vars in attr tmpl', t => {
  t.plan(7);
  var { el, template} = load('../build/importVars');
  var v = {
    somewhere: 'somewhere',
    beginning: 'beginning',
    the: 'the',
    of: 'of',
    at: 'at',
    two: 'two',
    vars: 'vars',
    a: 'a'
  };
  var icon = require('./styles').icon;
  template.set(v);
  t.equal(el.getAttribute('attr1'), `${icon} ${v.somewhere} in the beginning`);
  t.equal(el.getAttribute('attr2'), `somewhere ${v.at} the end ${icon}`);
  t.equal(el.getAttribute('attr3'), `${v.somewhere} ${icon} in ${v.the} middle`);
  t.equal(el.getAttribute('attr4'), `${icon}-is ${v.a} part ${v.of} name in the ${v.beginning}`);
  t.equal(el.getAttribute('attr5'), `is ${v.a} part ${v.of} name ${v.at} the end-${icon}`);
  t.equal(el.getAttribute('attr6'), `is ${v.a} part ${v.of} name-${icon}-in ${v.the} middle`);
  t.equal(el.children[0].getAttribute('attr1'), `inside parent between ${v.two}${icon}${v.vars}`);
});
it('should bind component', (t) => {
  t.plan(1);
  var { el, template } = load('../build/simpleComponents');
  template.set('component1', true);
  t.equal('I am an component 1!', el.querySelector('h1').textContent);
});

//import '../build/multiVar';
it('equal vars in different places', t => {
  t.plan(1);
  var { el, template } = load('../build/multiVar');
  var values = {
    id: 224647246,
    b: 'b',
    c: 'c'
  };
  template.set(values);
  t.equal(`${values.c} published ${values.id}`, el.find('.published').attr('class'));
});*/

//import '../build/complexClasses';
it('complexClasses', t => {
  t.plan(8);
  var { template } = load('../build/complexClasses');
  var values = {t2: [0, 0]};
  template.set(values);
  t.equal(true, body.childNodes[0] instanceof Text);
  t.equal(true, body.childNodes[1] instanceof Text);
  values = {t2: [0, 1]};
  template.set(values);
  t.equal(true, body.childNodes[0] instanceof Text);
  t.equal(true, body.childNodes[1] instanceof HTMLAnchorElement);
  values = {t2: [1, 0]};
  template.set(values);
  t.equal(true, body.childNodes[0] instanceof HTMLAnchorElement);
  t.equal(true, body.childNodes[1] instanceof Text);
  values = {t2: [1, 1]};
  template.set(values);
  t.equal(true, body.childNodes[0] instanceof HTMLAnchorElement);
  t.equal(true, body.childNodes[1] instanceof HTMLAnchorElement);
});

function load(tmlpName) {
  body.innerHTML = '';
  var template = require(tmlpName);
  try {
    template.render(body);
  } catch (e) {
    console.error(body.childNodes.length);
    console.error(JSON.stringify(e));
  }
  var el = body.childNodes[0];
  return { el, template };
}

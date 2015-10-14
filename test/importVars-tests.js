import {icon} from './styles';
export default function(t, load) {
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
  template.set(v);
  //t.equal(el.getAttribute('attr1'), icon + ' somewhere in the beginning');
  t.equal(el.getAttribute('attr1'), `${icon} ${v.somewhere} in the beginning`);
  t.equal(el.getAttribute('attr2'), `somewhere ${v.at} the end ${icon}`);
  t.equal(el.getAttribute('attr3'), `${v.somewhere} ${icon} in ${v.the} middle`);
  t.equal(el.getAttribute('attr4'), `${icon}-is ${v.a} part ${v.of} name in the ${v.beginning}`);
  t.equal(el.getAttribute('attr5'), `is ${v.a} part ${v.of} name ${v.at} the end-${icon}`);
  t.equal(el.getAttribute('attr6'), `is ${v.a} part ${v.of} name-${icon}-in ${v.the} middle`);
  t.equal(el.children[0].getAttribute('attr1'), `inside parent between ${v.two}${icon}${v.vars}`);
}

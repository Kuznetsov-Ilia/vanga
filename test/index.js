//import from 'mocha-sinon';
import { jsdom } from 'jsdom';
import assert from 'assert';
var log = console.log;
var document = jsdom('<html><body></body></html>');
describe('hooks', () => {
  before(() => {
    global.document = document;
    global.window = document.defaultView;
    require('misc/dom4');
  });
  after(() => {
    global.window.close();
  });
  beforeEach(()=>{
    document.body.innerHTML = '';
  })
  it('should bind html with content', () => {
    var {el, template} = load('../build/simpleHtml');
    template.set('htmlvar', '<a>some link</a>');
    var a = el.querySelector('a');
    assert.equal('a', a.tagName.toLowerCase());
    assert.equal('some link', a.textContent);
  });
  it('should bind text', () => {
    var {el, template} = load('../build/simpleText');
    var expectedText = 'some text';
    template.set('textvar', expectedText);
    assert.equal(expectedText, el.textContent);
  });
  it('should bind attributes', () => {
    var {el, template} = load('../build/simpleAttributes');
    var values = {
      b: 'b1',
      c: 'c1',
      d: 'd1',
      e: 'e1'
    }
    template.set(values);
    var {b, c, d, e} = values;
    assert.equal(`a ${b} ${c+d}e`, el.getAttribute('href'));
    assert.equal('e1', el.getAttribute('data-e'));
  });
  it('should bind component', () => {
    var {el, template} = load('../build/simpleComponents');
    template.set('component1', true);
    console.log(template.get('component1'));
    //assert.equal('I am an component 1!', el.querySelector('h1').textContent);
  });

});

function load(tmlpName){
  var template = require(tmlpName);
  template.render(document.body);
  var el = document.body.childNodes[0];
  return {el, template};
}

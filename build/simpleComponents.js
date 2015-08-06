import Template from 'vanga/base';
;

var __SHARED__ = {};
var simpleTextCase = __SHARED__['simpleTextCase'] =  new Template(
  "<div><a href=\"/some\">aa</a>some text here<!--component1--></div>",
  {"component1":[{"path":[0,2],"type":"class","attrs":[]}]},
  [],
  __SHARED__,
  {}
);

export default simpleTextCase;
;
var component1 = __SHARED__['component1'] =  new Template(
  "<h1>I am an component 1!</h1>",
  {},
  [],
  __SHARED__,
  {}
);

;
;

;

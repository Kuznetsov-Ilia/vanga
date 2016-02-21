import Template from 'vanga/base';
;

var __SHARED__ = {};
var Pagination = __SHARED__['Pagination'] =  new Template(
  "<div class=\"" + pagination + "\"><a class=\"left\" href=\"\">&larr;</a><a class=\"first\" href=\"\"><!--{first}--></a><a href=\"\"><!--{m2}--></a><a href=\"\"><!--{m1}--></a><a href=\"\"><!--{current}--></a><a href=\"\"><!--{p1}--></a><a href=\"\"><!--{p2}--></a><a class=\"last\" href=\"\"><!--{last}--></a><a class=\"right\" href=\"\">&rarr;</a></div>",
  {"left":[{"type":"named","path":[0,0]},{"type":"attr","attr":0}],"base":[{"type":"attr","attr":0},{"type":"attr","attr":1},{"type":"attr","attr":2},{"type":"attr","attr":3},{"type":"attr","attr":4},{"type":"attr","attr":5},{"type":"attr","attr":6},{"type":"attr","attr":7},{"type":"attr","attr":8}],"first":[{"type":"named","path":[0,1]},{"type":"attr","attr":1},{"type":"text","path":[0,1,0]}],"m2":[{"type":"named","path":[0,2]},{"type":"attr","attr":2},{"type":"text","path":[0,2,0]}],"m1":[{"type":"named","path":[0,3]},{"type":"attr","attr":3},{"type":"text","path":[0,3,0]}],"current":[{"type":"named","path":[0,4]},{"type":"attr","attr":4},{"type":"text","path":[0,4,0]}],"p1":[{"type":"named","path":[0,5]},{"type":"attr","attr":5},{"type":"text","path":[0,5,0]}],"p2":[{"type":"named","path":[0,6]},{"type":"attr","attr":6},{"type":"text","path":[0,6,0]}],"last":[{"type":"named","path":[0,7]},{"type":"attr","attr":7},{"type":"text","path":[0,7,0]}],"right":[{"type":"named","path":[0,8]},{"type":"attr","attr":8}]},
  [{"keys":{"base":[0],"left":[1]},"name":"href","tmpl":["",""],"path":[0,0]},{"keys":{"base":[0],"first":[1]},"name":"href","tmpl":["",""],"path":[0,1]},{"keys":{"base":[0],"m2":[1]},"name":"href","tmpl":["",""],"path":[0,2]},{"keys":{"base":[0],"m1":[1]},"name":"href","tmpl":["",""],"path":[0,3]},{"keys":{"base":[0],"current":[1]},"name":"href","tmpl":["",""],"path":[0,4]},{"keys":{"base":[0],"p1":[1]},"name":"href","tmpl":["",""],"path":[0,5]},{"keys":{"base":[0],"p2":[1]},"name":"href","tmpl":["",""],"path":[0,6]},{"keys":{"base":[0],"last":[1]},"name":"href","tmpl":["",""],"path":[0,7]},{"keys":{"base":[0],"right":[1]},"name":"href","tmpl":["",""],"path":[0,8]}],
  __SHARED__,
  {}
);

export default Pagination;
;

;

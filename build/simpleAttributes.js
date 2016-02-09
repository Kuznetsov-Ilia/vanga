import Template from 'vanga/base';
;

var __SHARED__ = {};
var MarkedButton = __SHARED__['MarkedButton'] =  new Template(
  "<x-MarkedButton><button class=\"mark  action-- action--need-auth test2\" name=\"\" rel=\"nofollow\" type=\"button\" title=\"Нравится\" data-my=\"\" data-type=\"\" data-refid=\"\" data-state=\"\" data-refname=\"\" data-canmark=\"\" data-totalmarks=\"\"><i class=\"icon i--like\"></i><span class=\"totalmarks bold btn--text\"><!--Totalmarks--></span><span class=\"btn--text\">Нравится</span></button></x-MarkedButton>",
  {"clear":[{"type":"attr","attr":0}],"action":[{"type":"attr","attr":0}],"clb":[{"type":"attr","attr":1}],"my":[{"type":"attr","attr":2}],"type":[{"type":"attr","attr":3}],"refid":[{"type":"attr","attr":4}],"state":[{"type":"attr","attr":5}],"refname":[{"type":"attr","attr":6}],"canmark":[{"type":"attr","attr":7}],"totalmarks":[{"type":"attr","attr":8}],"iClassName":[{"type":"attr","attr":9}],"Totalmarks":[{"path":[0,0,1,0],"type":"class","attrs":[]}]},
  [{"keys":{"clear":[1],"action":[3]},"name":"class","tmpl":["mark ",""," action--",""," action--need-auth test2"],"path":[0,0]},{"keys":{"clb":[0]},"name":"name","tmpl":[""],"path":[0,0]},{"keys":{"my":[0]},"name":"data-my","tmpl":[""],"path":[0,0]},{"keys":{"type":[0]},"name":"data-type","tmpl":[""],"path":[0,0]},{"keys":{"refid":[0]},"name":"data-refid","tmpl":[""],"path":[0,0]},{"keys":{"state":[0]},"name":"data-state","tmpl":[""],"path":[0,0]},{"keys":{"refname":[0]},"name":"data-refname","tmpl":[""],"path":[0,0]},{"keys":{"canmark":[0]},"name":"data-canmark","tmpl":[""],"path":[0,0]},{"keys":{"totalmarks":[0]},"name":"data-totalmarks","tmpl":[""],"path":[0,0]},{"keys":{"iClassName":[1]},"name":"class","tmpl":["icon i--like",""],"path":[0,0,0]}],
  __SHARED__,
  {"totalmarks":["Totalmarks"]}
);

export default MarkedButton;
;
var Totalmarks = __SHARED__['Totalmarks'] =  new Template(
  "<x-Totalmarks><span class=\"totalmarks bold btn--text\"><!--{totalmarks}--></span></x-Totalmarks>",
  {"totalmarks":[{"type":"text","path":[0,0,0]}]},
  [],
  __SHARED__,
  {}
);

;
;

;

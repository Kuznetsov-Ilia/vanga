import Template from '../src';
;

var __SHARED__ = {};
var T1 = __SHARED__['T1'] =  new Template(
  "<x-T1><div class=\"\" style=\"width:10em;height:10em;background:gray;\"><!--{textvar}--></div><div style=\"width:10em;height:10em;background:blue;\">textvar</div><!--T2--></x-T1>",
  {"v1":[{"type":"attr","attr":0}],"var1":[{"type":"named","path":[0,0],"events":["click"]}],"textvar":[{"type":"text","path":[0,0,0]}],"var2":[{"type":"named","path":[0,1],"events":["click"]}],"T2":[{"path":[0,2],"type":"class","data":{}}]},
  [{"keys":{"v1":[1]},"name":"class","tmpl":[" ",""],"path":[0,0]}],
  __SHARED__,
  {}
);

export default T1;
;
var T2 = __SHARED__['T2'] =  new Template(
  "<a href=\"/sdsd\" style=\"width:10em;height:10em;background:green;\"></a>",
  {"var3":[{"type":"named","path":[0],"events":["click","mousein"]}]},
  [],
  __SHARED__,
  {}
);

;
;

;

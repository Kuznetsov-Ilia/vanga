import Template from 'vanga/base';
;

var __SHARED__ = {};
var SpaceTest = __SHARED__['SpaceTest'] =  new Template(
  "<x-SpaceTest>К оплате <b><!--{sum}--> Рублей</b></x-SpaceTest>",
  {"sum":[{"type":"text","path":[0,2,0]}]},
  [],
  __SHARED__,
  {}
);

export default SpaceTest;
;
var OO = __SHARED__['OO'] =  new Template(
  "<x-OO><div class=\"" + actions + "\"><b>Изменить</b> или <b>Отменить</b> заказ</div></x-OO>",
  {"edit":[{"type":"named","path":[0,0,0]}],"cancel":[{"type":"named","path":[0,0,4]}]},
  [],
  __SHARED__,
  {}
);

;
;

;

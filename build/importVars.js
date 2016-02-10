import Template from 'vanga/base';
import {icon} from "../test/styles";

var __SHARED__ = {"icon":icon};
var WatchButton = __SHARED__['WatchButton'] =  new Template(
  "<div attr1=\"" + icon + "  in the beginning\" attr2=\"somewhere  the end " + icon + "\" attr3=\"" + icon + " in  middle\" attr4=\"" + icon + "-is  part  name in the\" attr5=\"is  part  name  the end-" + icon + "\" attr6=\"is  part  name-" + icon + "-in  middle\"><div attr1=\"inside parent between " + icon + "\"></div></div>",
  {"somewhere":[{"type":"attr","attr":0},{"type":"attr","attr":2}],"at":[{"type":"attr","attr":1},{"type":"attr","attr":4}],"the":[{"type":"attr","attr":2},{"type":"attr","attr":5}],"a":[{"type":"attr","attr":3},{"type":"attr","attr":4},{"type":"attr","attr":5}],"of":[{"type":"attr","attr":3},{"type":"attr","attr":4},{"type":"attr","attr":5}],"beginning":[{"type":"attr","attr":3}],"two":[{"type":"attr","attr":6}],"vars":[{"type":"attr","attr":6}]},
  [{"keys":{"somewhere":[1]},"name":"attr1","tmpl":["" + icon + " ",""," in the beginning"],"path":[]},{"keys":{"at":[1]},"name":"attr2","tmpl":["somewhere ",""," the end " + icon + ""],"path":[]},{"keys":{"somewhere":[0],"the":[2]},"name":"attr3","tmpl":[""," " + icon + " in ",""," middle"],"path":[]},{"keys":{"a":[1],"of":[3],"beginning":[5]},"name":"attr4","tmpl":["" + icon + "-is ",""," part ",""," name in the ",""],"path":[]},{"keys":{"a":[1],"of":[3],"at":[5]},"name":"attr5","tmpl":["is ",""," part ",""," name ",""," the end-" + icon + ""],"path":[]},{"keys":{"a":[1],"of":[3],"the":[5]},"name":"attr6","tmpl":["is ",""," part ",""," name-" + icon + "-in ",""," middle"],"path":[]},{"keys":{"two":[1],"vars":[3]},"name":"attr1","tmpl":["inside parent between ","","" + icon + "",""],"path":[0,0]}],
  __SHARED__,
  {}
);

export default WatchButton;
;

;

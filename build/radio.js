import Template from 'my-vanga';;

var __SHARED__ = {};
var tmpl = __SHARED__['tmpl'] = new Template(
  "<div><a name=\"status\">ON</a><a name=\"status\">OFF</a><a name=\"status\">smth</a></div>", {
    "status": [{
      "input": "radio",
      "name": "on"
    }, {
      "input": "radio",
      "name": "off"
    }, {
      "input": "radio",
      "name": "smth"
    }]
  }, [],
  __SHARED__, {}
);

export default tmpl;;

;

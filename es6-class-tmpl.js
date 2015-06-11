__EXPR__
__EXPORT__  class __NAME__ extends Template {
  constructor () {
    super();
    var root = this.root = Template.load(__HTML__);
    this.conf = __CONF__;
    this.attr = __ATTR__;
    this.subClass = __SUBCLASS__;
  }
}

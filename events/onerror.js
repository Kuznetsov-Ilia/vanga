module.exports = function (e) {
  console.error('sax error! ', e, this.tag);
  this.error = null;
  this.resume();
}


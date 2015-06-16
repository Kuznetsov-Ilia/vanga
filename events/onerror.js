module.exports = function (e) {
  console.error('sax error! ', e)
  this.error = null;
  this.resume();
}


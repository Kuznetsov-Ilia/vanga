var fs = require('fs');
var leftpad = require('left-pad');
module.exports = function (parser) {
  return function (e) {
    var message = e.message;
    if (message.search('Malformed comment') === -1) {
      //console.error(e);
      var path = parser.parser.filepath;
      if (path) {
        var line = Number(message.match(/Line: ([\d]+)/)[1]);
        var column = Number(message.match(/Column: ([\d]+)/)[1]);
        var char = message.match(/Char: ([^\n]+)/)[1];
        //console.error(line, column, char);
        //console.error(e.message, '\nin ', path);
        var data = fs.readFileSync(path, 'utf8');
        var array = data.split('\n');
        //console.error(array);
        var file = [message.split('\n')[0], path, ''];
        if (line > 0) {
          file.push(array[line-1]);
        }
        
        var currentLine = array[line];
        var c1 = currentLine.slice(0, column);
        var index = c1.lastIndexOf(char);
        //console.error(index);
        if (index != -1) {
          file.push([
            currentLine,
            leftpad('^', index+1)
          ].join('\n'));
        } else {
          file.push(currentLine);
        }
        
        file.push(array[line+1] || '', '');
        
        console.error(file.join('\n'));
      }
    }
    
    this.error = null;
    this.resume();        
  }  
}

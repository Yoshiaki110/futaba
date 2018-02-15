//var str = 'bhvy';

function decode(str) {
  var v1 = str.charCodeAt(0);
  var v2 = str.charCodeAt(1);
  var v3 = str.charCodeAt(2);
  var v4 = str.charCodeAt(3);
  var csum = ((v1 - 0x61) << 4) + (v4 - 0x6B);
  var sum = v2 ^ v3;
  console.log("sum:" + csum + " " + sum);
  var jbit = (v2 - 0x61) << 4;
  var kbit = v3 - 0x6B;
  return jbit + kbit
}

var str = process.argv[2];
var id = decode(str);
console.log(str + ' => ' + id);

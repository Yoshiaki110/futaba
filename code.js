/*
上位ビットはシフト後61hを足して、下位ビットは6Bhを足す（AとBとする）
２つをXORしたのを、同様に上位ビットはシフト後61hを足して、下位ビットは6Bhを足す（CとDとする）
４つを文字コードに変換しCABDの順にする
英語の小文字４文字、最初と最後はチェックサム
*/

function code(id) {
  var jbit1 = (id >> 4) + 0x61;
//  console.log(jbit1);
  var kbit1 = (id & 0xF) + 0x6B;
//  console.log(kbit1);
  var csum = jbit1 ^ kbit1;
//  console.log(csum);
  var jbit2 = (csum >> 4) + 0x61;
//  console.log(jbit2);
  var kbit2 = (csum & 0xF) + 0x6B;
//  console.log(kbit2);
  var code = String.fromCharCode(jbit2, jbit1, kbit1, kbit2);
  return code;
}

var id = parseInt(process.argv[2]);
var str = code(id);
console.log(id + ' => ' + str);

/*
��ʃr�b�g�̓V�t�g��61h�𑫂��āA���ʃr�b�g��6Bh�𑫂��iA��B�Ƃ���j
�Q��XOR�����̂��A���l�ɏ�ʃr�b�g�̓V�t�g��61h�𑫂��āA���ʃr�b�g��6Bh�𑫂��iC��D�Ƃ���j
�S�𕶎��R�[�h�ɕϊ���CABD�̏��ɂ���
�p��̏������S�����A�ŏ��ƍŌ�̓`�F�b�N�T��
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

var config = require('./config.js');

var CallBackID = 38;
var net = require('net');
var HOST = config.HOST;
var SPORT = 80;

global.sock = null;
global.watchdog = new Date();

function connect() {
    global.sock = new net.Socket();
    global.sock.setNoDelay();
    console.log('1 CONNECTED TO: ' + HOST + ':' + SPORT);
    global.sock.connect(SPORT, HOST, function() {
        console.log('2 CONNECTED TO: ' + HOST + ':' + SPORT);
    });

    global.sock.on('connect', function() {
        console.log('EVENT connect');
    });

    global.sock.on('data', function(data) {
        global.watchdog = new Date();

        if (data.length >= 3) {    // ３バイト以上のデータのみ使用
            var p = -1;
            for (var i = data.length - 2; i--; ) {
//                console.log(data[i]);
                if (data[i] == 255) {
                    p = i;
                }
            }
            if (p >= 0) {                      // 正しいデータあり
               console.log('  receive id:' + data[p+1] + ' val:' + data[p+2] + ' len:' + data.length);
               if (data[p+1] == CallBackID) {
                 var val = '' + CallBackID;
                 io.sockets.emit('publish', {from: val, to: val, value: val});    // 送信
               }
            } else {
                console.log('receive not found separater. data len:' + data.length);
            }
        } else {
            console.log('receive illegal data len:' + data.length);
        }
    });

    global.sock.on('end', function() {
        console.log('EVENT end');
    });

    global.sock.on('timeout', function() {
        console.log('4 EVENT timeout');
    });

    global.sock.on('drain', function() {
        console.log('3 EVENT drain');
    });

    global.sock.on('error', function(error) {
        console.log('2 EVENT error:' + error);
        global.sock.destroy();
        global.sock = null;
    });

    global.sock.on('close', function(had_error) {
        console.log('1 EVENT close:' + had_error);
        global.sock = null;
    });
}

function send(id, data) {
    console.log('send:', id, data);
    if (null == global.sock) {
        connect();
    }
    //d = String.fromCharCode(rand);      // 1バイトの文字列（コード）にする
    var d = new Buffer(3);
    d[0] = 255;
    d[1] = id;
    d[2] = data;
    //console.log('send:' + d);
    global.sock.write(d);
}


var fs = require('fs');
var port = process.env.PORT || 8000;

var server = require('http').createServer(function(req,res){
  res.writeHead(200, {'Content-Type':'text/html'});
  var output = fs.readFileSync('./index.html','utf-8');
  res.end(output);
}).listen(port);


var io = require('socket.io').listen(server);

var userHash = {};

// 
io.sockets.on('connection', function(socket){
  // 接続されたら
  socket.on('connected', function(name){
    var msg = name + 'が入室しました';
    userHash[socket.id] = name;     // socket.idは「DcNuwT4Rhr18fyqLAAAC」のような値
    io.sockets.emit('publish', {from: '', to: '', value: msg});    // 送信
    console.log('connected');
  });

  // 受信したら
  socket.on('publish', function(data){
    console.log(data);
    io.sockets.emit('publish', {from: data.from, to: data.to, value: data.value});  // 送信
    send(data.to, data.value);
  });

  // 切断されたら
  socket.on('disconnect', function(){
    if (userHash[socket.id]){
      var msg = userHash[socket.id] + 'が退出しました';
      delete userHash[socket.id];
      io.sockets.emit('publish', {from: '', to: '', value: msg});  // 送信
    }
  });
});

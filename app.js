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

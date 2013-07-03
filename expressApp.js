var express = require('express');

var app = express.createServer();

app.use(express.static(__dirname + '/public'));

app.listen(9181);

app.get('/', function (req, res) {
  res.sendfile(__dirname + '/index.html');
});

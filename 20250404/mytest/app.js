var express = require('express');
var app = express();
var routes = require('./routes/routes');

// 정적 파일 제공
app.use('/public', express.static('public'));

// 라우트 설정
app.use('/', routes);

// 서버 시작
app.listen(3000, '0.0.0.0', function () {
    console.log('Server is running on http://0.0.0.0:3000');
  });
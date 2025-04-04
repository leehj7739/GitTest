var express = require('express');
var router = express.Router();
var path = require('path'); // path 모듈 추가
var request = require('request');

// 기본 경로 ("/")에 대한 라우트 추가
router.get('/', function(req, res) {
  res.sendFile(path.join(__dirname, '..', 'views', 'index.html')); // index.html 파일을 클라이언트에게 응답으로 보냄
});

// 블로그 검색 라우트
router.get('/search/blog', function(req, res) {
   var api_url = 'https://openapi.naver.com/v1/search/blog?query=' + encodeURIComponent(req.query.query);
   var options = {
       url: api_url,
       headers: {
           'X-Naver-Client-Id': 'Wr40DDBa3DiBuxos2tsN',
           'X-Naver-Client-Secret': '9s9klEIvxH'
       }
   };

   request.get(options, function (error, response, body) {
     if (!error && response.statusCode == 200) {
       res.writeHead(200, {'Content-Type': 'application/json;charset=utf-8'});
       res.end(body);
     } else {
       res.status(response.statusCode).end();
       console.log('error = ' + response.statusCode);
     }
   });
});

module.exports = router;

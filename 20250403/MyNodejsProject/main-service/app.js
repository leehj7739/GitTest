const express = require('express');
const app = express();
const port = 3000;

app.get('/', (req, res) => {
  res.send(`
    <h1>메인 화면</h1>
    <p>아래의 링크를 클릭하여 각 서비스를 이용할 수 있습니다:</p>
    <ul>
      <li><a href="/lunch/">점심추천 서비스</a></li>
      <li><a href="/news/">뉴스 서비스</a></li>
      <li><a href="/monitoring/">모니터링 서비스</a></li>
    </ul>
  `);
});

app.listen(port, () => {
  console.log(`Main service running at http://localhost:${port}`);
});

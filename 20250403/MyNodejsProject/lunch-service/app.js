const express = require('express');
const app = express();
const port = 3000;

// 음식점 정보 예시
const restaurants = [
  { name: '김밥천국', menu: ['김밥', '떡볶이', '라면'] },
  { name: '비빔밥집', menu: ['비빔밥', '냉면', '튀김'] },
  { name: '초밥집', menu: ['초밥', '롤', '우동'] },
];

app.get('/', (req, res) => {
  const restaurant = restaurants[Math.floor(Math.random() * restaurants.length)];
  const menu = restaurant.menu[Math.floor(Math.random() * restaurant.menu.length)];
  res.send(`
    <h1>점심추천 서비스</h1>
    <p>오늘의 추천 음식점: ${restaurant.name}</p>
    <p>추천 메뉴: ${menu}</p>
  `);
});

app.listen(port, () => {
  console.log(`Lunch service running at http://localhost:${port}`);
});

import express from 'express';
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

const app = express();
const port = 3000;

app.get('/', async (req, res) => {
  try {
    // 네이버 뉴스 페이지에서 인기 뉴스 목록을 크롤링
    const response = await fetch('https://news.naver.com/main/ranking/popularDay.nhn?mid=etc&sid1=105', {
      headers: {
        'Cache-Control': 'no-cache',  // 캐시를 사용하지 않도록 설정
      },
      cache: 'no-store',  // 브라우저 캐시를 방지
    });

    const body = await response.text();  // HTML 본문을 텍스트로 변환

    // cheerio로 HTML 파싱
    const $ = cheerio.load(body);

    const newsList = [];
    
    // 'ol.ranking_list' 요소 안의 'li' 항목에서 제목과 링크를 추출
    $('ol.ranking_list li a').each((i, element) => {
      const title = $(element).text().trim();  // 뉴스 제목
      const link = $(element).attr('href');   // 뉴스 링크
      console.log('뉴스 제목:', title);       // 콘솔에 제목 출력
      console.log('뉴스 링크:', link);        // 콘솔에 링크 출력
      newsList.push({ title, link });
    });

    // 크롤링된 뉴스 목록을 HTML로 변환하여 응답으로 반환
    res.send(`
      <h1>뉴스 서비스</h1>
      <ul>
        ${newsList.map(news => `<li><a href="${news.link}" target="_blank">${news.title}</a></li>`).join('')}
      </ul>
    `);

  } catch (error) {
    // 오류 발생 시 에러 메시지를 클라이언트에 전송
    console.error('뉴스 크롤링 실패:', error);  // 서버에서 에러 출력
    res.status(500).send('뉴스 크롤링 실패');
  }
});

app.listen(port, () => {
  console.log(`News service running at http://localhost:${port}`);
});

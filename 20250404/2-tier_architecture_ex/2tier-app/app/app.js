const express = require('express');
const mysql = require('mysql2/promise');
const app = express();
const config = require('./config');

console.log(`환경: ${process.env.NODE_ENV || 'development'}`);
console.log(`DB 연결 설정: ${JSON.stringify(config.db)}`);

// JSON 파싱 미들웨어
app.use(express.json());

// MySQL 연결 설정
const pool = mysql.createPool({
  host: config.db.host,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// 홈페이지
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>2-Tier Architecture Demo</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
          }
          h1 {
            color: #2c3e50;
          }
          .container {
            background-color: #f9f9f9;
            border-radius: 5px;
            padding: 20px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          th, td {
            padding: 10px;
            border: 1px solid #ddd;
            text-align: left;
          }
          th {
            background-color: #f2f2f2;
          }
          .server-info {
            margin-top: 20px;
            padding: 10px;
            background-color: #e8f4f8;
            border-radius: 5px;
          }
          form {
            margin-top: 20px;
            padding: 15px;
            background-color: #f0f0f0;
            border-radius: 5px;
          }
          input[type="text"], input[type="email"] {
            width: 100%;
            padding: 8px;
            margin: 5px 0 15px;
            display: inline-block;
            border: 1px solid #ccc;
            border-radius: 4px;
            box-sizing: border-box;
          }
          button {
            background-color: #4CAF50;
            color: white;
            padding: 10px 15px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
          }
          button:hover {
            background-color: #45a049;
          }
          .tab {
            overflow: hidden;
            border: 1px solid #ccc;
            background-color: #f1f1f1;
            margin-top: 20px;
          }
          .tab button {
            background-color: inherit;
            float: left;
            border: none;
            outline: none;
            cursor: pointer;
            padding: 14px 16px;
            transition: 0.3s;
            color: black;
          }
          .tab button:hover {
            background-color: #ddd;
          }
          .tab button.active {
            background-color: #ccc;
          }
          .tabcontent {
            display: none;
            padding: 6px 12px;
            border: 1px solid #ccc;
            border-top: none;
          }
          #userList {
            display: block;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>2-Tier Architecture Demo</h1>
          <p>이 페이지는 Docker로 구성된 2-Tier 아키텍처 애플리케이션입니다.</p>
          
          <div class="server-info">
            <h3>서버 정보:</h3>
            <ul>
              <li>환경: ${process.env.NODE_ENV || 'development'}</li>
              <li>App Server: ${require('os').hostname()} (컨테이너)</li>
              <li>DB Server: ${config.db.host}</li>
              <li>Node.js 버전: ${process.version}</li>
            </ul>
          </div>
          
          <div class="tab">
            <button class="tablinks active" onclick="openTab(event, 'userList')">사용자 목록</button>
            <button class="tablinks" onclick="openTab(event, 'addUser')">사용자 추가</button>
            <button class="tablinks" onclick="openTab(event, 'deleteUser')">사용자 삭제</button>
          </div>

          <div id="userList" class="tabcontent">
            <h2>사용자 목록</h2>
            <div id="users-table">데이터베이스에서 사용자 정보를 불러오는 중...</div>
          </div>

          <div id="addUser" class="tabcontent">
            <h2>새 사용자 추가</h2>
            <form id="addUserForm">
              <label for="username">사용자명:</label>
              <input type="text" id="username" name="username" required>
              
              <label for="email">이메일:</label>
              <input type="email" id="email" name="email" required>
              
              <button type="submit">사용자 추가</button>
            </form>
            <div id="addUserResult"></div>
          </div>

          <div id="deleteUser" class="tabcontent">
            <h2>사용자 삭제</h2>
            <p>삭제할 사용자의 ID를 입력하세요:</p>
            <form id="deleteUserForm">
              <label for="userId">사용자 ID:</label>
              <input type="text" id="userId" name="userId" required>
              
              <button type="submit">사용자 삭제</button>
            </form>
            <div id="deleteUserResult"></div>
          </div>
          
          <script>
            // 탭 기능
            function openTab(evt, tabName) {
              var i, tabcontent, tablinks;
              tabcontent = document.getElementsByClassName("tabcontent");
              for (i = 0; i < tabcontent.length; i++) {
                tabcontent[i].style.display = "none";
              }
              tablinks = document.getElementsByClassName("tablinks");
              for (i = 0; i < tablinks.length; i++) {
                tablinks[i].className = tablinks[i].className.replace(" active", "");
              }
              document.getElementById(tabName).style.display = "block";
              evt.currentTarget.className += " active";
            }

            // 사용자 목록 로딩
            function loadUsers() {
              fetch('/api/users')
                .then(response => response.json())
                .then(data => {
                  const tableEl = document.getElementById('users-table');
                  if (data.error) {
                    tableEl.innerHTML = '<p style="color: red;">에러: ' + data.error + '</p>';
                  } else if (data.length === 0) {
                    tableEl.innerHTML = '<p>사용자 데이터가 없습니다.</p>';
                  } else {
                    let tableHtml = '<table><tr><th>ID</th><th>사용자명</th><th>이메일</th><th>생성일</th></tr>';
                    data.forEach(user => {
                      tableHtml += '<tr><td>' + user.id + '</td><td>' + user.username + '</td><td>' + user.email + '</td><td>' + new Date(user.created_at).toLocaleString() + '</td></tr>';
                    });
                    tableHtml += '</table>';
                    tableEl.innerHTML = tableHtml;
                  }
                })
                .catch(err => {
                  document.getElementById('users-table').innerHTML = '<p style="color: red;">데이터 로딩 실패: ' + err.message + '</p>';
                });
            }

            // 초기 사용자 목록 로딩
            loadUsers();

            // 사용자 추가 폼 제출 처리
            document.getElementById('addUserForm').addEventListener('submit', function(e) {
              e.preventDefault();
              
              const username = document.getElementById('username').value;
              const email = document.getElementById('email').value;
              const resultEl = document.getElementById('addUserResult');
              
              resultEl.innerHTML = '처리 중...';
              
              fetch('/api/users', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, email }),
              })
              .then(response => response.json())
              .then(data => {
                if (data.error) {
                  resultEl.innerHTML = '<p style="color: red;">에러: ' + data.error + '</p>';
                } else {
                  resultEl.innerHTML = '<p style="color: green;">사용자가 성공적으로 추가되었습니다. ID: ' + data.id + '</p>';
                  document.getElementById('username').value = '';
                  document.getElementById('email').value = '';
                  loadUsers(); // 사용자 목록 새로고침
                }
              })
              .catch(err => {
                resultEl.innerHTML = '<p style="color: red;">요청 실패: ' + err.message + '</p>';
              });
            });

            // 사용자 삭제 폼 제출 처리
            document.getElementById('deleteUserForm').addEventListener('submit', function(e) {
              e.preventDefault();
              
              const userId = document.getElementById('userId').value;
              const resultEl = document.getElementById('deleteUserResult');
              
              resultEl.innerHTML = '처리 중...';
              
              fetch('/api/users/' + userId, {
                method: 'DELETE'
              })
              .then(response => {
                if (!response.ok) {
                  return response.json().then(err => { throw new Error(err.error || '삭제 실패'); });
                }
                return response.json();
              })
              .then(data => {
                resultEl.innerHTML = '<p style="color: green;">사용자가 성공적으로 삭제되었습니다.</p>';
                document.getElementById('userId').value = '';
                loadUsers(); // 사용자 목록 새로고침
              })
              .catch(err => {
                resultEl.innerHTML = '<p style="color: red;">에러: ' + err.message + '</p>';
              });
            });
          </script>
        </div>
      </body>
    </html>
  `);
});

// API 엔드포인트 - 사용자 목록 조회
app.get('/api/users', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM users');
    res.json(rows);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: '데이터베이스 조회 중 오류가 발생했습니다.' });
  }
});

// API 엔드포인트 - 사용자 추가
app.post('/api/users', async (req, res) => {
  try {
    const { username, email } = req.body;
    
    if (!username || !email) {
      return res.status(400).json({ error: '사용자명과 이메일은 필수 입력 항목입니다.' });
    }
    
    const [result] = await pool.query(
      'INSERT INTO users (username, email) VALUES (?, ?)',
      [username, email]
    );
    
    res.status(201).json({ 
      id: result.insertId,
      username,
      email,
      message: '사용자가 성공적으로 추가되었습니다.' 
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: '사용자 추가 중 오류가 발생했습니다.' });
  }
});

// TODO: API 엔드포인트 - 사용자 삭제 (구현 필요)
app.delete('/api/users/:id', async (req, res) => {
  // 이 부분을 구현해 주세요!
  const userId = req.params.id;  // URL에서 사용자 ID 추출
  
  try {
    // 사용자가 존재하는지 먼저 확인
    const [userCheck] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
    
    if (userCheck.length === 0) {
      // 사용자가 없으면 404 반환
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    }

    // 사용자 삭제 쿼리 실행
    const [result] = await pool.query('DELETE FROM users WHERE id = ?', [userId]);

    // 삭제된 행 수 확인
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: '사용자 삭제 실패' });
    }

    // 성공적으로 삭제된 경우
    res.status(200).json({ message: `사용자 ID ${userId}가 성공적으로 삭제되었습니다.` });

  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: '사용자 삭제 중 오류가 발생했습니다.' });
  }
});

// 서버 상태 확인 엔드포인트
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', time: new Date().toISOString() });
});

// 서버 시작
app.listen(config.port, () => {
  console.log(`App server is running on port ${config.port}`);
  console.log(`Database connection configured to: ${config.db.host}`);
});

// app.js
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const promClient = require('prom-client');
const fs = require('fs');
const path = require('path');

// 환경 변수 로드
const {
  PORT = 3000,
  NODE_ENV = 'development',
  DB_HOST,
  DB_PORT = 3306,
  DB_USER,
  DB_PASSWORD,
  DB_NAME,
  LOG_LEVEL = 'info'
} = process.env;

// 로깅 설정
const LOG_DIR = '/var/log/app';
// 로그 디렉토리가, 마운트가 안되어 있을 수도 있어서 먼저 없으면 생성
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

const logFilePath = path.join(LOG_DIR, 'backend.log');
const errorLogFilePath = path.join(LOG_DIR, 'error.log');

// 로깅 함수
function log(level, message) {
  const timestamp = new Date().toISOString();
  const logEntry = `${timestamp} - ${level.toUpperCase()} - ${message}\n`;
  
  // 콘솔 출력
  console.log(logEntry);
  
  // 파일에 기록
  try {
    if (level === 'error') {
      fs.appendFileSync(errorLogFilePath, logEntry);
    }
    fs.appendFileSync(logFilePath, logEntry);
  } catch (err) {
    console.error(`로그 파일 쓰기 오류: ${err.message}`);
  }
}

// 메트릭 설정
const register = new promClient.Registry();
promClient.collectDefaultMetrics({ register });

// 커스텀 메트릭
const httpRequestDurationMicroseconds = new promClient.Histogram({
  name: 'http_request_duration_ms',
  help: 'Duration of HTTP requests in ms',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000]
});

const httpRequestsTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

register.registerMetric(httpRequestDurationMicroseconds);
register.registerMetric(httpRequestsTotal);

// 앱 초기화
const app = express();

// 미들웨어
app.use(cors());
app.use(express.json());

// 요청 로깅 및 메트릭 수집 미들웨어
app.use((req, res, next) => {
  const start = Date.now();
  
  // 원래 end 함수를 저장
  const originalEnd = res.end;
  
  // 요청 시작 로깅
  log('info', `Request: ${req.method} ${req.originalUrl}`);
  
  // end 함수 오버라이드
  res.end = function() {
    // 원래 함수 호출
    originalEnd.apply(res, arguments);
    
    // 메트릭 업데이트
    const duration = Date.now() - start;
    const route = req.route ? req.route.path : req.path;
    
    httpRequestDurationMicroseconds
      .labels(req.method, route, res.statusCode)
      .observe(duration);
    
    httpRequestsTotal
      .labels(req.method, route, res.statusCode)
      .inc();
    
    // 응답 완료 로깅
    log('info', `Response: ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
  };
  
  next();
});

// MySQL 연결 풀 생성
let pool;
async function initializeDbConnection() {
  try {
    pool = mysql.createPool({
      host: DB_HOST,
      port: parseInt(DB_PORT, 10),
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
    
    // 연결 테스트
    const connection = await pool.getConnection();
    log('info', `데이터베이스 연결 성공: ${DB_HOST}:${DB_PORT}/${DB_NAME}`);
    connection.release();
    
    return true;
  } catch (err) {
    log('error', `데이터베이스 연결 오류: ${err.message}`);
    return false;
  }
}

// 라우트 설정
// 건강 체크 엔드포인트
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// 메트릭 엔드포인트 (Prometheus가 스크래핑할 수 있도록)
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// 서버 정보 엔드포인트
app.get('/api/info', (req, res) => {
  res.json({
    environment: NODE_ENV,
    version: '1.0.0',
    db_host: DB_HOST,
    hostname: require('os').hostname()
  });
});

// 사용자 API
// 모든 사용자 조회
app.get('/api/users', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM users ORDER BY id');
    res.json(rows);
  } catch (err) {
    log('error', `사용자 조회 오류: ${err.message}`);
    res.status(500).json({ error: '데이터베이스 조회 중 오류가 발생했습니다.' });
  }
});

// 특정 사용자 조회
app.get('/api/users/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    }
    
    res.json(rows[0]);
  } catch (err) {
    log('error', `사용자 ID ${req.params.id} 조회 오류: ${err.message}`);
    res.status(500).json({ error: '데이터베이스 조회 중 오류가 발생했습니다.' });
  }
});

// 사용자 추가
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
    
    log('info', `사용자 추가: ${username} (${email}), ID: ${result.insertId}`);
  } catch (err) {
    log('error', `사용자 추가 오류: ${err.message}`);
    res.status(500).json({ error: '사용자 추가 중 오류가 발생했습니다.' });
  }
});

// 사용자 삭제
app.delete('/api/users/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    
    // userId가 유효한 숫자인지 확인
    if (isNaN(userId) || userId <= 0) {
      return res.status(400).json({ error: '유효하지 않은 사용자 ID입니다.' });
    }
    
    // 사용자 존재 여부 확인
    const [checkResult] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
    
    if (checkResult.length === 0) {
      return res.status(404).json({ error: '해당 ID의 사용자를 찾을 수 없습니다.' });
    }
    
    // 사용자 삭제
    const [result] = await pool.query('DELETE FROM users WHERE id = ?', [userId]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: '삭제할 사용자를 찾을 수 없습니다.' });
    }
    
    res.json({ message: '사용자가 성공적으로 삭제되었습니다.' });
    
    log('info', `사용자 삭제: ID ${userId}`);
  } catch (err) {
    log('error', `사용자 삭제 오류 (ID ${req.params.id}): ${err.message}`);
    res.status(500).json({ error: '사용자 삭제 중 오류가 발생했습니다.' });
  }
});

// 서버 시작
async function startServer() {
  const dbConnected = await initializeDbConnection();
  
  if (!dbConnected) {
    log('warn', '데이터베이스 연결 실패. 5초 후 재시도...');
    setTimeout(startServer, 5000);
    return;
  }
  
  app.listen(PORT, () => {
    log('info', `서버가 포트 ${PORT}에서 실행 중입니다.`);
    log('info', `환경: ${NODE_ENV}`);
  });
}

startServer();

// 프로세스 종료 처리
process.on('SIGTERM', () => {
  log('info', 'SIGTERM 신호를 받았습니다. 서버를 종료합니다.');
  if (pool) pool.end();
  process.exit(0);
});

process.on('SIGINT', () => {
  log('info', 'SIGINT 신호를 받았습니다. 서버를 종료합니다.');
  if (pool) pool.end();
  process.exit(0);
});

// 예상치 못한 오류 처리
process.on('uncaughtException', (err) => {
  log('error', `처리되지 않은 예외: ${err.message}`);
  log('error', err.stack);
  
  if (pool) pool.end();
  process.exit(1);
});
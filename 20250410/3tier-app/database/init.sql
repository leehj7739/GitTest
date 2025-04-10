-- 데이터베이스 생성
CREATE DATABASE IF NOT EXISTS myapp;
USE myapp;

-- users 테이블 생성
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  email VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 초기 데이터 삽입
INSERT INTO users (username, email) VALUES
('user1', 'user1@example.com'),
('user2', 'user2@example.com'),
('user3', 'user3@example.com');

-- 모니터링을 위한 사용자 생성 (Grafana/Prometheus 용)
CREATE USER IF NOT EXISTS 'monitor'@'%' IDENTIFIED BY 'monitorpass';
GRANT SELECT ON myapp.* TO 'monitor'@'%';
FLUSH PRIVILEGES;
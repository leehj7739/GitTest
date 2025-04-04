CREATE DATABASE IF NOT EXISTS nodeapp;
USE nodeapp;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  email VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 기본 사용자 데이터 추가
INSERT INTO users (username, email) VALUES
('user1', 'user1@example.com'),
('user2', 'user2@example.com'),
('user3', 'user3@example.com');

-- Grafana 모니터링을 위한 권한 설정
CREATE USER IF NOT EXISTS 'grafana'@'%' IDENTIFIED BY 'grafana';
GRANT SELECT ON nodeapp.* TO 'grafana'@'%';
FLUSH PRIVILEGES;

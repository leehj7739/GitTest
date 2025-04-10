FROM mysql:8.0

# MySQL 설정 파일 복사
COPY my.cnf /etc/mysql/conf.d/

# 초기화 스크립트 복사
COPY init.sql /docker-entrypoint-initdb.d/

# 포트 설정
EXPOSE 3306
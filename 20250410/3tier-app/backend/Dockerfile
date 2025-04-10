FROM node:16-alpine

WORKDIR /usr/src/app

# 종속성 설치
COPY package*.json ./
RUN npm install

# 소스 코드 복사
COPY . .

# 로그 디렉토리 생성
RUN mkdir -p /var/log/app
RUN chmod 777 /var/log/app

# 애플리케이션 포트 노출
EXPOSE 3000

# 시작 명령
CMD ["node", "app.js"]
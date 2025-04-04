# Node.js 이미지를 기반으로 시작
FROM node:16-slim

# 작업 디렉토리 설정
WORKDIR /usr/src/app

# 의존성 파일 복사
COPY package*.json ./

# 의존성 설치
RUN npm install --production

# 애플리케이션 파일 복사
COPY . .

# 3000 포트 열기
EXPOSE 3000

# 애플리케이션 실행
CMD ["node", "app.js"]

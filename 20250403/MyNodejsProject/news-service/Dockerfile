# Node.js 공식 이미지 사용
FROM node:16-alpine

# 작업 디렉토리 설정
WORKDIR /usr/src/app

# package.json과 package-lock.json을 먼저 복사하여 의존성 설치
COPY package*.json ./

# 의존성 설치
RUN npm install

# 애플리케이션 소스 코드를 컨테이너에 복사
COPY . .

# 3000번 포트 열기
EXPOSE 3000

# 서버 실행 명령
CMD ["node", "app.js"]

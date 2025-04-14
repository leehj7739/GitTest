# 1. Node.js 이미지를 기반으로 설정
FROM node:16

# 2. 작업 디렉토리 설정
WORKDIR /usr/src/app

# 3. package.json 및 package-lock.json 파일 복사
COPY package*.json ./

# 4. 의존성 설치
RUN npm install

# 5. 애플리케이션 소스 코드 복사
COPY . .

# 6. 앱 빌드
RUN npm run build

# 7. 앱이 실행될 포트 설정
EXPOSE 3000

# 8. 애플리케이션 시작
CMD ["npm", "start"]

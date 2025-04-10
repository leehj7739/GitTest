# 빌드 단계
FROM node:16-alpine as build

WORKDIR /app

# 종속성 설치
COPY package*.json ./
RUN npm install

# 소스 코드 복사 및 빌드
COPY . .
RUN npm run build

# 배포 단계
FROM nginx:alpine

# Nginx 설정 복사
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 빌드된 정적 파일 복사
COPY --from=build /app/build /usr/share/nginx/html

# 컨테이너 포트 노출
EXPOSE 80

# 건강 체크를 위한 상태 페이지 생성
RUN echo "OK" > /usr/share/nginx/html/health

CMD ["nginx", "-g", "daemon off;"]
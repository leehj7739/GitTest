# Docker Hub 로그인
docker login

# 프론트엔드 이미지 빌드 및 푸시
cd frontend
docker build -t djkeem/3tier-frontend:latest . --no-cache
docker push djkeem/3tier-frontend:latest

# 백엔드 이미지 빌드 및 푸시
cd ../backend
docker build -t djkeem/3tier-backend:latest . --no-cache

# 데이터베이스 이미지 빌드 및 푸시 (선택 사항)
cd ../database
docker build -t djkeem/3tier-database:latest . --no-cache
docker push djkeem/3tier-database:latest
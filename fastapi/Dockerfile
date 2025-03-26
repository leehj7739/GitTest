# Python 베이스 이미지 사용
FROM python:3.9-slim

# 작업 디렉토리 설정
WORKDIR /

# 의존성 파일 복사 및 설치

RUN pip install fastapi
RUN pip install uvicorn

# 애플리케이션 코드 복사
COPY ./ /

# 컨테이너 실행 시 명령어
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY main.py .
# 필요한 파일 복사
COPY . /app

# 로그 디렉터리 생성
RUN mkdir -p /var/log/fastapi
RUN chmod 777 /var/log/fastapi

# 실행 명령 수정 (로그 설정 관련 옵션 제거)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
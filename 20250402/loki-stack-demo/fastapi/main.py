import logging
import time
from fastapi import FastAPI, Request
from datetime import datetime
from prometheus_client import Counter, Histogram, make_asgi_app # type: ignore

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler("/var/log/fastapi/app.log"),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger("fastapi-app")

app = FastAPI()

# Prometheus 메트릭 설정
REQUEST_COUNT = Counter("fastapi_requests_total", "Total FastAPI HTTP requests", ["method", "endpoint", "status"])
REQUEST_LATENCY = Histogram("fastapi_request_latency_seconds", "FastAPI request latency in seconds", ["method", "endpoint"])


# Prometheus 메트릭 엔드포인트 추가
metrics_app = make_asgi_app()
app.mount("/metrics", metrics_app)  # /metrics 경로로 마운트

@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()

    # 요청 로깅
    logger.info(f"Request started: {request.method} {request.url.path}")

    response = await call_next(request)

    # 응답 시간 계산
    process_time = time.time() - start_time
    logger.info(f"Request completed: {request.method} {request.url.path} - Took: {process_time:.4f}s")

    # Prometheus 메트릭 기록
    # /metrics 엔드포인트는 제외
    if not request.url.path.startswith("/metrics"):
        REQUEST_COUNT.labels(
            method=request.method,
            endpoint=request.url.path,
            status=response.status_code
        ).inc()
        REQUEST_LATENCY.labels(
            method=request.method,
            endpoint=request.url.path
        ).observe(process_time)

    return response

@app.get("/")
async def root():
    logger.info("Root endpoint called")
    return {"message": "Hello World"}

@app.get("/health")
async def health():
    logger.info("Health check endpoint called")
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.get("/error")
async def trigger_error():
    logger.error("Error endpoint called - Generating sample error")
    return {"error": "This is a sample error log message"}

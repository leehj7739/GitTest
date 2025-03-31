@echo off
chcp 65001
setlocal

set /p IP="IP 주소를 입력하세요 (예: 192.168.1.100): "
set ENDPOINT_URL=http://%IP%:4566

for /f "tokens=3" %%a in ('aws s3 ls --endpoint-url=%ENDPOINT_URL%') do (
    set BUCKET_NAME=%%a
    call :DownloadFiles
)

goto :END

:DownloadFiles
echo 버킷 "%BUCKET_NAME%"의 파일을 다운로드 중...
mkdir "%BUCKET_NAME%"
aws s3 sync s3://%BUCKET_NAME% .\%BUCKET_NAME%\ --endpoint-url=%ENDPOINT_URL%
echo "%BUCKET_NAME%" 버킷의 파일 다운로드가 완료되었습니다.
goto :EOF

:END
endlocal

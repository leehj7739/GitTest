#apt update
sudo apt update

#docker install
echo "docker를 설치합니다..."
sudo apt-get install -y docker.io

#
sleep 10
echo "docker 그룹 추가..."
#docker group add
sudo usermod -aG docker ubuntu


# redirection child process에서 실행, 기존 프로세스에서 실행하면 그룹권한이 미적용상태로 도커 명령어 사용불가
sudo -i -u ubuntu bash <<'EOF'

echo "running as ubuntu: $(date)"

echo "docker 이미지 다운로드..."    
docker pull ngrinder/agent

sleep 10

echo "docker 컨테이너 실행..."
docker run -d -v ~/ngrinder-agent:/opt/ngrinder-agent --name agent ngrinder/agent <ngrinder-controller-ip>
echo "docker 컨테이너 확인..."
docker ps

EOF


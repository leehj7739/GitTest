#apt update
sudo apt update

#docker install
echo "docker를 설치합니다..."
sudo apt-get install -y docker.io

#docker start
#sudo systemctl start docker

#docker test
#docker --version

#
sleep 10
#echo "docker 그룹 추가..."
#docker group add
#sudo usermod -aG docker ubuntu
#echo "docker 그룹 적용..."
#docker group apply
#newgrp docker

#권한 수정
echo "docker 권한 수정..."
sudo chmod 666 /var/run/docker.sock

sleep 10

echo "docker 이미지 다운로드..."    
#docker pull
docker pull ngrinder/agent

sleep 10

echo "docker 컨테이너 실행..."
#docker run
docker run -d -v ~/ngrinder-agent:/opt/ngrinder-agent --name agent ngrinder/agent <ngrinder-controller-ip>

#docker ps

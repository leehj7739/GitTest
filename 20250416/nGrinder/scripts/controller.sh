#apt update
sudo apt-get update -q

#docker install
sudo apt-get install -y docker.io

#docker start
sudo systemctl start docker

#docker test
docker --version

#docker group add
sudo usermod -aG docker ubuntu

#docker group apply
newgrp docker

#docker pull
docker pull ngrinder/controller

#docker run
docker run -d -v ~/ngrinder-controller:/opt/ngrinder-controller --name controller -p 80:80 -p 16001:16001 -p 12000-12009:12000-12009 ngrinder/controller

#docker test
docker ps

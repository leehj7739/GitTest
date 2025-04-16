#!/bin/bash
# 모든 명령어의 표준 출력과 표준 에러를 /home/ubuntu/userdata.log 파일에 저장함
exec > /home/ubuntu/userdata.log 2>&1

set -x

echo "Userdata is started: $(date)"

ls -la

# AWS 자격 증명 설정
export AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
export AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}

sudo -i -u ubuntu bash <<'EOF'
set -x

echo "\n"
echo "running as ubuntu: $(date)"

export AWS_DEFAULT_REGION=kr-central-2

curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"

sudo apt-get update -q
sudo apt-get install -q -y unzip
unzip awscliv2.zip
sudo ./aws/install

aws --version

aws --region kr-central-2 --endpoint-url=https://objectstorage.kr-central-2.kakaocloud.com s3 cp s3://your-bucket-name/scripts/ ./scripts/ --recursive

ls

bash ./scripts/start_vm.sh

EOF

echo "\nrunning as ubuntu finished: $(date)\n"

echo "Userdata is finished: $(date)"

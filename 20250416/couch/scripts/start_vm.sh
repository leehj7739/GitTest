#!/bin/bash

// 각종 필요한 패키지 인스톨
sudo apt update

sleep 15

// couchbase 실행은 별도 파일로 분리
//bash /home/ubuntu/scripts/install_couchbase.sh master

bash /home/ubuntu/scripts/install_couchbase.sh worker <masterip>
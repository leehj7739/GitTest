#!/bin/bash
set -e

###################################
# Couchbase Server 설치 및 클러스터 구성 스크립트
# 환경: Ubuntu 기반
# 사용법:
#   마스터 노드: sh ./install_couchbase.sh master
#   워커 노드:   sh ./install_couchbase.sh worker <master_ip>
###################################

# 변경이 필요한 변수들 (원하는 Couchbase 버전과 시스템 리소스에 맞게 조정)
COUCHBASE_VERSION="7.0.2"
PACKAGE_NAME="couchbase-server-enterprise_${COUCHBASE_VERSION}-ubuntu20.04_amd64.deb"
DOWNLOAD_URL="https://packages.couchbase.com/releases/${COUCHBASE_VERSION}/${PACKAGE_NAME}"

# 클러스터 초기화 관련 변수 (필요에 따라 수정)
ADMIN_USER="admin"
ADMIN_PASS="password"
RAM_SIZE=1024         # 데이터 서비스에 할당할 메모리 (MB 단위)
INDEX_RAM_SIZE=256    # 인덱스 서비스에 할당할 메모리 (MB 단위)
SERVICES="data,index,query"

# 현재 노드 IP 확인 (네트워크 상황에 따라 변경될 수 있음)
NODE_IP=$(hostname -I | awk '{print $1}')

echo "현재 노드 IP: $NODE_IP"

# 시스템 패키지 업데이트 및 wget 설치
sudo apt-get update
sudo apt-get install -y wget
sudo apt-get install -y bzip2

# Couchbase Server 패키지 다운로드 (이미 존재하면 다운로드 생략)
if [ ! -f "$PACKAGE_NAME" ]; then
    echo "Couchbase Server 패키지를 다운로드 합니다: $DOWNLOAD_URL"
    wget $DOWNLOAD_URL
else
    echo "패키지가 이미 존재합니다: $PACKAGE_NAME"
fi

# Couchbase Server 설치
echo "Couchbase Server를 설치합니다..."
sudo dpkg -i $PACKAGE_NAME


# Couchbase 서비스가 시작될 시간을 잠시 대기 (필요에 따라 조정)
echo "서비스가 시작될 때까지 잠시 대기합니다..."
sleep 30

# 스크립트 실행 모드에 따라 동작을 분기
if [ "$1" == "master" ]; then
    echo "마스터 노드로 클러스터 초기화를 진행합니다..."
    /opt/couchbase/bin/couchbase-cli cluster-init \
        -c ${NODE_IP}:8091 \
        --cluster-username ${ADMIN_USER} \
        --cluster-password ${ADMIN_PASS} \
        --cluster-port 8091 \
        --cluster-ramsize ${RAM_SIZE} \
        --cluster-index-ramsize ${INDEX_RAM_SIZE} \
        --services ${SERVICES} 
    echo "클러스터 초기화 완료: 노드 ${NODE_IP} (마스터)"

    # 클러스터 구성이 완료된 후, 필요시 리밸런싱 시작
    echo "리밸런싱을 시작합니다..."
    /opt/couchbase/bin/couchbase-cli rebalance \
        -c ${NODE_IP}:8091 \
        -u ${ADMIN_USER} \
        -p ${ADMIN_PASS}
    echo "리밸런싱 요청 완료."

elif [ "$1" == "worker" ]; then
    # 워커 모드에서는 마스터 노드 IP를 두 번째 인자로 받아야 합니다.
    if [ -z "$2" ]; then
        echo "사용법: bash ./install_couchbase.sh worker <master_ip>"
        exit 1
    fi
    MASTER_IP=$2
    

    attempt=1
    max_attempts=5

    while [ $attempt -le $max_attempts ]; do
        echo "워커 노드로 마스터(${MASTER_IP})에 서버 추가 진행중 (시도 ${attempt}/${max_attempts})..."
    
        # 서버 추가 명령을 if 문 안에서 실행합니다.
        if /opt/couchbase/bin/couchbase-cli server-add \
               -c "${MASTER_IP}:8091" \
               -u "${ADMIN_USER}" \
               -p "${ADMIN_PASS}" \
               --server-add "${NODE_IP}" \
               --server-add-username "${ADMIN_USER}" \
               --server-add-password "${ADMIN_PASS}"; then
            echo "노드 ${NODE_IP}가 클러스터(${MASTER_IP})에 추가되었습니다."
            break
        else
            echo "서버 추가 실패."
        fi

        if [ $attempt -lt $max_attempts ]; then
            echo "30초 후 재시도합니다..."
            sleep 30
        else
            echo "최대 시도 횟수(${max_attempts})를 초과하여 서버 추가에 실패했습니다."
        fi

        attempt=$((attempt+1))
    done

else
    echo "사용법이 잘못되었습니다."
    echo "마스터 노드: bash ./install_couchbase.sh master"
    echo "워커 노드: bash ./install_couchbase.sh worker <master_ip>"
    exit 1
fi
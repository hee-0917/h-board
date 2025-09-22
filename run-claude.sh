#!/bin/bash

# Claude CLI 실행을 위한 최적화된 스크립트
# 파일 감시자 문제 해결을 위한 환경 변수 설정

echo "Claude CLI를 최적화된 설정으로 실행합니다..."

# Node.js 메모리 최적화
export NODE_OPTIONS="--max-old-space-size=4096"

# 파일 감시 최적화 (polling 방식 사용)
export CHOKIDAR_USEPOLLING=true
export CHOKIDAR_INTERVAL=1000

# 파일 감시 제외 패턴 설정
export CHOKIDAR_IGNORED="**/node_modules/**|**/.git/**|**/.next/**|**/coverage/**|**/build/**|**/out/**|**/*.log|**/*.tmp|**/*.temp|**/*.xlsx|**/*.xls|**/*.sql"

# 현재 파일 감시자 상태 확인
echo "현재 파일 감시자 사용량:"
lsof | grep inotify | wc -l

echo "파일 감시자 한계:"
cat /proc/sys/fs/inotify/max_user_watches

echo "Claude CLI를 시작합니다..."

# Claude CLI 실행
claude "$@"


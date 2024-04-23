# 기본 이미지
FROM redis:latest

# Redis 설정 파일을 사용하여 서버 실행
CMD ["redis-server", "--requirepass", "$(REDIS_PASSWORD)"]

# 포트 설정
EXPOSE 6379
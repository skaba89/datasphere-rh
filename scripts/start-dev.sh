#!/bin/bash
# Persistent dev server launcher
cd /home/z/my-project
pkill -f "next-server" 2>/dev/null
pkill -f "next dev" 2>/dev/null
sleep 2

# Launch with nohup, redirecting both stdout and stderr to dev.log
nohup npx next dev -p 3000 > dev.log 2>&1 &
PID=$!
echo "Started Next dev server PID=$PID"

# Wait until ready (max 30s)
for i in $(seq 1 30); do
  if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ 2>/dev/null | grep -q "200"; then
    echo "Server ready after ${i}s"
    exit 0
  fi
  sleep 1
done
echo "Server failed to start in 30s"
exit 1

#!/bin/bash

# HAPI 检测并停止服务脚本
# 用法: ./hapi-stop.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CLI_DIR="$SCRIPT_DIR/cli"

echo "=========================================="
echo "HAPI 检测并停止服务"
echo "=========================================="

# 步骤1: 检测并停止 hapi 服务
echo ""
echo "[1/2] 检测并停止 hapi 服务..."
HAPI_PIDS=$(pgrep -f "hapi hub" 2>/dev/null || true)
if [ -n "$HAPI_PIDS" ]; then
    echo "发现 hapi 进程: $HAPI_PIDS"
    echo "正在停止..."
    pkill -f "hapi hub" 2>/dev/null || true
    sleep 1
    # 强制终止残留进程
    pkill -9 -f "hapi hub" 2>/dev/null || true
    sleep 1
else
    echo "未发现运行中的 hapi 服务"
    exit 0
fi

# 检查端口 3006 是否被占用
PORT_PID=$(lsof -ti:3006 2>/dev/null || true)
if [ -n "$PORT_PID" ]; then
    echo "端口 3006 被进程 $PORT_PID 占用，正在释放..."
    kill -9 "$PORT_PID" 2>/dev/null || true
    sleep 1
fi

# 等待服务停止
sleep 1

# 检查服务停止状态
echo ""
echo "=========================================="
if lsof -i:3006 > /dev/null 2>&1; then
    echo "❌ 服务停止失败，端口 3006 仍被占用"
    HAPI_PID=$(pgrep -f "hapi hub" | head -1)
    if [ -n "$HAPI_PID" ]; then
        echo "   残留 PID: $HAPI_PID"
    fi
    exit 1
else
    echo "✅ 服务已成功停止 (端口 3006 已释放)"
fi
echo "=========================================="
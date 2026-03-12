#!/bin/bash

# HAPI 重新构建并重启服务脚本
# 用法: ./rebuild-and-restart.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CLI_DIR="$SCRIPT_DIR/cli"

echo "=========================================="
echo "HAPI 重新构建并重启服务"
echo "=========================================="

# 步骤1: 构建 single-exe
echo ""
echo "[1/4] 构建 single-exe..."
cd "$SCRIPT_DIR"
bun run build:single-exe

# 步骤2: 安装构建的二进制到全局 bin 目录
echo ""
echo "[2/4] 安装 hapi 到全局 bin 目录..."

# 检测当前平台
case "$(uname -s)-$(uname -m)" in
    Darwin-x86_64)  PLATFORM="bun-darwin-x64" ;;
    Darwin-arm64)   PLATFORM="bun-darwin-arm64" ;;
    Linux-x86_64)   PLATFORM="bun-linux-x64" ;;
    Linux-aarch64)  PLATFORM="bun-linux-arm64" ;;
    *)              PLATFORM="bun-darwin-x64" ;;  # 默认值
esac

BINARY_PATH="$CLI_DIR/dist-exe/$PLATFORM/hapi"

if [ -f "$BINARY_PATH" ]; then
    # 检测全局 bin 目录
    GLOBAL_BIN=$(npm config get prefix 2>/dev/null)/bin
    if [ ! -d "$GLOBAL_BIN" ]; then
        GLOBAL_BIN="/usr/local/bin"
    fi
    echo "构建二进制: $BINARY_PATH"
    echo "安装目标: $GLOBAL_BIN/hapi"

    # 创建符号链接（优先不加 sudo，失败后再加 sudo）
    if ln -sf "$BINARY_PATH" "$GLOBAL_BIN/hapi" 2>/dev/null; then
        echo "✅ 已安装到 $GLOBAL_BIN/hapi"
    elif sudo ln -sf "$BINARY_PATH" "$GLOBAL_BIN/hapi" 2>/dev/null; then
        echo "✅ 已安装到 $GLOBAL_BIN/hapi (使用 sudo)"
    else
        echo "❌ 安装失败，请检查权限"
        exit 1
    fi
else
    echo "❌ 错误: 未找到构建的二进制文件: $BINARY_PATH"
    echo "请确认步骤1构建成功"
    exit 1
fi

# 步骤3: 检测并停止 hapi 服务
echo ""
echo "[3/4] 检测并停止 hapi 服务..."
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
fi

# 检查端口 3006 是否被占用
PORT_PID=$(lsof -ti:3006 2>/dev/null || true)
if [ -n "$PORT_PID" ]; then
    echo "端口 3006 被进程 $PORT_PID 占用，正在释放..."
    kill -9 "$PORT_PID" 2>/dev/null || true
    sleep 1
fi

# 步骤4: 启动 hapi hub 服务
echo ""
echo "[4/4] 启动 hapi hub 服务..."
cd "$SCRIPT_DIR"
hapi hub start &

# 等待服务启动
sleep 2

# 检查服务状态
echo ""
echo "=========================================="
if lsof -i:3006 > /dev/null 2>&1; then
    echo "✅ 服务已成功启动 (端口 3006)"
    HAPI_PID=$(pgrep -f "hapi hub" | head -1)
    if [ -n "$HAPI_PID" ]; then
        echo "   PID: $HAPI_PID"
    fi
else
    echo "❌ 服务启动失败，请检查日志"
    exit 1
fi
echo "=========================================="
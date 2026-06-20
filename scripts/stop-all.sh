#!/bin/bash
echo "🛑 正在停止高校实验动物房管理系统..."

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 读取保存的 PID
BACKEND_PID=""
FRONTEND_PID=""

if [ -f "$SCRIPT_DIR/.backend.pid" ]; then
    BACKEND_PID=$(cat "$SCRIPT_DIR/.backend.pid")
fi

if [ -f "$SCRIPT_DIR/.frontend.pid" ]; then
    FRONTEND_PID=$(cat "$SCRIPT_DIR/.frontend.pid")
fi

# 停止后端
if [ -n "$BACKEND_PID" ] && kill -0 "$BACKEND_PID" 2>/dev/null; then
    kill "$BACKEND_PID" 2>/dev/null
    echo "✅ 已停止后端进程 (PID: $BACKEND_PID)"
    rm -f "$SCRIPT_DIR/.backend.pid"
else
    echo "ℹ️  后端服务未运行"
fi

# 停止前端
if [ -n "$FRONTEND_PID" ] && kill -0 "$FRONTEND_PID" 2>/dev/null; then
    kill "$FRONTEND_PID" 2>/dev/null
    echo "✅ 已停止前端进程 (PID: $FRONTEND_PID)"
    rm -f "$SCRIPT_DIR/.frontend.pid"
else
    echo "ℹ️  前端服务未运行"
fi

# 清理残留进程
PIDS=$(pgrep -f "dotnet.*LabAnimalManagement" 2>/dev/null)
if [ -n "$PIDS" ]; then
    kill $PIDS 2>/dev/null
    echo "✅ 已清理残留后端进程: $PIDS"
fi

PIDS=$(pgrep -f "ng serve" 2>/dev/null)
if [ -n "$PIDS" ]; then
    kill $PIDS 2>/dev/null
    echo "✅ 已清理残留前端进程: $PIDS"
fi

echo ""
echo "✅ 所有服务已停止"

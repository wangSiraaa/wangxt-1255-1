#!/bin/bash
echo "=========================================="
echo "  高校实验动物房管理系统 - 全栈启动"
echo "=========================================="

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_LOG="$SCRIPT_DIR/backend.log"
FRONTEND_LOG="$SCRIPT_DIR/frontend.log"

# 清理之前的日志
> "$BACKEND_LOG"
> "$FRONTEND_LOG"

echo "📝 后端日志: $BACKEND_LOG"
echo "📝 前端日志: $FRONTEND_LOG"
echo ""

# 启动后端
echo "🚀 启动后端服务..."
/bin/bash "$SCRIPT_DIR/start-backend.sh" > "$BACKEND_LOG" 2>&1 &
BACKEND_PID=$!
echo "   后端进程 PID: $BACKEND_PID"

# 等待后端启动
sleep 8

# 检查后端是否启动成功
if kill -0 "$BACKEND_PID" 2>/dev/null; then
    echo "✅ 后端服务已启动 (http://localhost:5103)"
    echo "📖 Swagger UI: http://localhost:5103/swagger"
else
    echo "❌ 后端服务启动失败，请查看日志: $BACKEND_LOG"
    exit 1
fi

echo ""

# 启动前端
echo "🚀 启动前端服务..."
/bin/bash "$SCRIPT_DIR/start-frontend.sh" > "$FRONTEND_LOG" 2>&1 &
FRONTEND_PID=$!
echo "   前端进程 PID: $FRONTEND_PID"

# 等待前端启动
sleep 15

if kill -0 "$FRONTEND_PID" 2>/dev/null; then
    echo "✅ 前端服务已启动 (http://localhost:4200)"
else
    echo "❌ 前端服务启动失败，请查看日志: $FRONTEND_LOG"
fi

echo ""
echo "=========================================="
echo "  🎉 系统启动完成！"
echo "  🌐 前端地址: http://localhost:4200"
echo "  🔧 后端Swagger: http://localhost:5103/swagger"
echo ""
echo "  停止服务请运行: scripts/stop-all.sh"
echo "  或手动执行: kill $BACKEND_PID $FRONTEND_PID"
echo "=========================================="

# 保存 PID
echo "$BACKEND_PID" > "$SCRIPT_DIR/.backend.pid"
echo "$FRONTEND_PID" > "$SCRIPT_DIR/.frontend.pid"

# 等待用户退出
trap "echo ''; echo '🛑 正在停止服务...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; rm -f '$SCRIPT_DIR/.backend.pid' '$SCRIPT_DIR/.frontend.pid'; echo '✅ 所有服务已停止'; exit" SIGINT SIGTERM

echo "按 Ctrl+C 停止所有服务..."
wait

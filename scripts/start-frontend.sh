#!/bin/bash
echo "=========================================="
echo "  高校实验动物房管理系统 - 启动前端服务"
echo "=========================================="

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
FRONTEND_DIR="$PROJECT_DIR/frontend"

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未找到 Node.js，请先安装 Node.js 18+ 和 npm"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d. -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ 错误: 需要 Node.js 18 或更高版本，当前版本: $(node -v)"
    exit 1
fi

echo "✅ Node.js 版本检查通过: $(node -v)"

# 检查 Angular CLI
if ! command -v ng &> /dev/null; then
    echo "ℹ️  未找到全局 Angular CLI，将通过 npm scripts 运行"
fi

# 安装 npm 依赖
cd "$FRONTEND_DIR"
if [ ! -d "node_modules" ]; then
    echo ""
    echo "📦 正在安装 npm 依赖 (首次启动可能需要较长时间)..."
    npm install || { echo "❌ npm 依赖安装失败"; exit 1; }
    echo "✅ npm 依赖安装完成"
else
    echo "✅ 检测到 node_modules，跳过依赖安装"
    echo "   如需重新安装，请删除 frontend/node_modules 目录"
fi

# 启动开发服务器
echo ""
echo "🚀 启动 Angular 开发服务器 (http://localhost:4200)..."
echo "🔌 后端 API 地址: http://localhost:5103"
echo ""
echo "按 Ctrl+C 停止服务"
echo "=========================================="

npm start

#!/bin/bash
echo "=========================================="
echo "  高校实验动物房管理系统 - 启动后端服务"
echo "=========================================="

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BACKEND_DIR="$PROJECT_DIR/backend"

# 检查 .NET 8 SDK
if ! command -v dotnet &> /dev/null; then
    echo "❌ 错误: 未找到 .NET SDK，请先安装 .NET 8 SDK"
    exit 1
fi

DOTNET_VERSION=$(dotnet --version | cut -d. -f1)
if [ "$DOTNET_VERSION" -lt 8 ]; then
    echo "❌ 错误: 需要 .NET 8 或更高版本，当前版本: $(dotnet --version)"
    exit 1
fi

echo "✅ .NET SDK 版本检查通过: $(dotnet --version)"

# 还原 NuGet 包
echo ""
echo "📦 正在还原 NuGet 包..."
cd "$BACKEND_DIR"
dotnet restore || { echo "❌ NuGet 包还原失败"; exit 1; }
echo "✅ NuGet 包还原完成"

# 检查连接字符串
echo ""
echo "ℹ️  请确保已在 backend/LabAnimalManagement.API/appsettings.json 中配置正确的 SQL Server 连接字符串"
echo "   默认连接字符串: Server=localhost;Database=LabAnimalManagement;User Id=sa;Password=YourPassword123!;TrustServerCertificate=True"

# 启动服务
echo ""
echo "🚀 启动后端 Web API 服务 (http://localhost:5103)..."
echo "📖 Swagger UI 地址: http://localhost:5103/swagger"
echo ""
echo "按 Ctrl+C 停止服务"
echo "=========================================="

cd "$BACKEND_DIR/LabAnimalManagement.API"
dotnet run --no-restore

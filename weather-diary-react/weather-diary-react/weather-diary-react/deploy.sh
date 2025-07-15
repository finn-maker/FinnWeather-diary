#!/bin/bash

# 🚀 天气日记本自动部署脚本

echo "🌟 开始部署天气日记本..."

# 检查Node.js版本
echo "📦 检查Node.js版本..."
node --version
npm --version

# 安装依赖
echo "📦 安装依赖..."
npm install

# 运行测试
echo "🧪 运行测试..."
npm test -- --coverage --watchAll=false

# 构建项目
echo "🔨 构建项目..."
npm run build

# 检查构建文件
if [ -d "build" ]; then
    echo "✅ 构建成功！build 文件夹已生成"
    echo "📁 构建文件大小:"
    du -sh build/
else
    echo "❌ 构建失败！"
    exit 1
fi

# 提示部署选项
echo ""
echo "🚀 构建完成！请选择部署方式："
echo "1. Vercel: vercel --prod"
echo "2. Netlify: 上传 build 文件夹到 netlify.com"
echo "3. GitHub Pages: npm run deploy (需要先配置)"
echo ""
echo "🌟 祝你部署成功！" 
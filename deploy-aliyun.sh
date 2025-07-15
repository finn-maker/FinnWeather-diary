#!/bin/bash

# 阿里云OSS部署脚本
echo "🚀 开始部署到阿里云OSS..."

# 构建项目
echo "📦 构建项目..."
npm run build

# 安装阿里云CLI工具
# npm install -g @alicloud/cli

# 上传到OSS
echo "📤 上传文件到OSS..."
# ossutil cp -r build/ oss://你的bucket名称/ --update

echo "✅ 部署完成！"
echo "🌐 访问地址: http://你的bucket名称.oss-cn-hangzhou.aliyuncs.com" 
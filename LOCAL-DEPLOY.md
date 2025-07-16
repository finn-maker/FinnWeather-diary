# 🚀 本地部署指南

本文档介绍如何在本地部署天气日记到GitHub Pages，无需等待GitHub Actions。

## 📋 前置要求

```bash
# 确保已安装必要工具
npm install -g serve    # 用于本地预览
npm install            # 安装项目依赖
```

## 🛠️ 快速命令

### ⚡ 一键部署（推荐）
```bash
npm run quick-deploy
```
这会自动构建项目并部署到GitHub Pages。

### 👀 本地预览构建结果
```bash
npm run dev-preview
```
构建项目并在本地预览，地址：http://localhost:3000

### 🚀 仅部署（已有build文件夹）
```bash
npm run deploy
```

### 📦 仅构建（不部署）
```bash
npm run build
```

### 🔍 仅预览（已有build文件夹）
```bash
npm run preview
```

## 🎯 高级用法：本地部署工具

使用我们提供的专用部署工具：

```bash
# 显示帮助
node local-deploy.js help

# 完整部署流程
node local-deploy.js full

# 只构建
node local-deploy.js build

# 本地预览
node local-deploy.js preview

# 直接部署
node local-deploy.js deploy

# 开发模式
node local-deploy.js dev
```

## ⏱️ 部署时间对比

| 方法 | 时间 | 说明 |
|------|------|------|
| **本地部署** | 1-2分钟 | 最快，直接从本地构建部署 |
| GitHub Actions | 3-5分钟 | 在GitHub服务器构建部署 |
| 手动上传 | 5-10分钟 | 需要手动操作多个步骤 |

## 🔧 故障排除

### Q: serve命令不存在
```bash
npm install -g serve
```

### Q: gh-pages部署失败
```bash
# 检查git配置
git config --list

# 确保有推送权限
git remote -v
```

### Q: 本地预览显示404
确保：
1. 已运行 `npm run build`
2. build文件夹存在
3. 使用正确的端口访问

### Q: 部署后网站没更新
1. 强制刷新浏览器：`Ctrl + Shift + R`
2. 清除浏览器缓存
3. 等待2-3分钟让CDN更新

## 📊 部署状态检查

### 本地检查
```bash
# 检查build文件夹
ls -la build/

# 检查文件大小
du -sh build/
```

### 线上检查
- 网站地址：https://finn-maker.github.io/FinnWeather-diary/
- GitHub Pages设置：https://github.com/finn-maker/FinnWeather-diary/settings/pages
- Actions状态：https://github.com/finn-maker/FinnWeather-diary/actions

## 🎯 最佳实践

1. **开发时**：使用 `npm start` 进行开发
2. **测试时**：使用 `npm run dev-preview` 本地测试构建结果
3. **部署时**：使用 `npm run quick-deploy` 快速部署
4. **调试时**：使用 `node local-deploy.js full` 完整流程

## 🚨 注意事项

- 本地部署会绕过GitHub Actions
- 确保代码已提交到Git仓库
- 部署前最好先本地预览确认无误
- 部署后等待2-3分钟让更改生效

---

**🎉 现在你可以享受极速的本地部署体验！** 
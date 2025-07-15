# 🚀 GitHub Pages 部署指南

## 第一步：创建GitHub仓库

请按照以下步骤在GitHub上创建仓库：

1. **访问GitHub**
   - 打开 [github.com](https://github.com)
   - 登录你的账号

2. **创建新仓库**
   - 点击右上角的 "+" 按钮
   - 选择 "New repository"
   - 仓库名称：`weather-diary-react`
   - 设置为 **Public（公开）**
   - **不要**勾选 "Add a README file"
   - 点击 "Create repository"

## 第二步：推送代码到GitHub

创建仓库后，回到终端执行：

```bash
# 推送代码到GitHub
git push -u origin main
```

## 第三步：部署到GitHub Pages

代码推送成功后：

```bash
# 构建并部署到GitHub Pages
npm run deploy
```

## 第四步：配置GitHub Pages

1. 在GitHub仓库页面，点击 "Settings"
2. 在左侧菜单找到 "Pages"
3. 在 "Source" 部分选择 "Deploy from a branch"
4. 选择分支：`gh-pages`
5. 文件夹选择：`/ (root)`
6. 点击 "Save"

## 访问你的网站

部署完成后，你的天气日记将在以下地址可用：

```
https://finn-maker.github.io/weather-diary-react/
```

## 当前配置状态

✅ package.json 已配置正确的homepage
✅ gh-pages 包已安装
✅ 部署脚本已配置
✅ Git远程仓库已设置

**下一步**：请按照上述步骤创建GitHub仓库，然后运行部署命令。 
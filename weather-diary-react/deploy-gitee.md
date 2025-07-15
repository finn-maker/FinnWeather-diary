# Gitee Pages 部署指南

## 方法一：网页上传（最简单）

1. 访问你的Gitee仓库
2. 点击"上传文件"
3. 拖拽整个 `build` 文件夹
4. 提交上传
5. 仓库设置 → Gitee Pages → 启动
6. 部署目录选择 `build`

## 方法二：Git命令行

```bash
# 1. 克隆你的空仓库
git clone https://gitee.com/你的用户名/weather-diary-react.git
cd weather-diary-react

# 2. 复制build文件夹内容到仓库
cp -r ../path/to/build/* ./

# 3. 提交并推送
git add .
git commit -m "部署静态网站"
git push origin master

# 4. 在Gitee网页开启Pages服务
```

## 方法三：使用gh-pages工具

```bash
# 1. 修改package.json中的仓库地址
# 2. 安装依赖
npm install --save-dev gh-pages

# 3. 部署
npm run deploy
```

## 访问地址
部署成功后，访问地址为：
https://你的用户名.gitee.io/weather-diary-react 
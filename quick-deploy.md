# 🚀 快速部署到Gitee指南

## 第一步：在Gitee创建仓库

1. 访问 [gitee.com](https://gitee.com) 
2. 点击右上角 "+" → "新建仓库"
3. 仓库名称：`weather-diary-react`
4. **务必设置为公开仓库**
5. **不要**勾选"使用Readme文件初始化这个仓库"
6. 点击创建

## 第二步：获取仓库地址

创建完成后，Gitee会显示仓库地址，类似：
```
https://gitee.com/你的用户名/weather-diary-react.git
```

## 第三步：运行命令上传

```bash
# 添加Gitee远程仓库（替换成你的真实地址）
git remote add gitee https://gitee.com/你的用户名/weather-diary-react.git

# 推送代码
git push gitee master
```

## 第四步：开启Gitee Pages

1. 进入你的Gitee仓库页面
2. 点击 "服务" → "Gitee Pages"
3. 点击 "启动" 按钮
4. 部署目录选择：`build`（如果有的话，否则选择根目录）
5. 等待部署完成

## 第五步：访问网站

部署成功后，访问地址为：
```
https://你的用户名.gitee.io/weather-diary-react
```

## 🔧 如果遇到认证问题

如果push时要求输入用户名密码：
- 用户名：你的Gitee用户名
- 密码：你的Gitee密码

或者使用私人令牌：
1. Gitee设置 → 私人令牌
2. 生成新令牌
3. 使用令牌作为密码

## 🌟 成功后

你的天气日记应用就可以通过互联网访问了！
- 支持手机和电脑访问
- 支持夜晚主题（18:00-06:00自动切换）
- 手动夜晚模式：在网址后加 `?night=true`

例如：
- 正常模式：https://你的用户名.gitee.io/weather-diary-react
- 夜晚模式：https://你的用户名.gitee.io/weather-diary-react?night=true 
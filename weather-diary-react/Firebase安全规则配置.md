# 🔒 Firebase安全规则配置指南

## 🚨 当前问题
你的应用显示 **"Missing or insufficient permissions"** 错误，这是因为Firestore安全规则阻止了数据访问。

## 🔧 解决方案

### 第1步：登录Firebase控制台
1. 访问：https://console.firebase.google.com/
2. 选择你的项目：`weather-diary-app-69053`
3. 在左侧菜单点击 **"Firestore Database"**

### 第2步：修改安全规则
1. 在Firestore Database页面，点击 **"规则"** 标签
2. 将现有规则替换为以下内容：

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 允许匿名用户访问diaries集合
    match /diaries/{document} {
      // 允许读取：用户已认证
      allow read: if request.auth != null;
      
      // 允许创建：用户已认证且userId匹配
      allow create: if request.auth != null 
        && request.auth.uid == resource.data.userId;
      
      // 允许更新：用户已认证且userId匹配
      allow update: if request.auth != null 
        && request.auth.uid == resource.data.userId;
      
      // 允许删除：用户已认证且userId匹配
      allow delete: if request.auth != null 
        && request.auth.uid == resource.data.userId;
    }
    
    // 允许匿名用户访问用户配置
    match /users/{userId} {
      allow read, write: if request.auth != null 
        && request.auth.uid == userId;
    }
  }
}
```

### 第3步：发布规则
1. 点击 **"发布"** 按钮
2. 等待规则生效（通常几秒钟）

## 🧪 测试配置

### 方法1：使用Firebase控制台测试
1. 在Firestore Database页面点击 **"开始集合"**
2. 集合ID输入：`diaries`
3. 文档ID：自动生成
4. 添加字段：
   - `userId`: `test-user`
   - `title`: `测试日记`
   - `content`: `这是一条测试日记`
   - `timestamp`: `1705741800000`
5. 点击 **"保存"**

### 方法2：重启应用测试
1. 停止开发服务器：`Ctrl+C`
2. 重新启动：`npm start`
3. 打开浏览器开发者工具
4. 查看控制台是否还有权限错误

## 🔍 规则说明

### 匿名认证规则
```javascript
allow read: if request.auth != null;
```
- 只允许已认证的用户读取数据
- 支持匿名登录

### 用户数据隔离
```javascript
allow create: if request.auth != null 
  && request.auth.uid == resource.data.userId;
```
- 用户只能创建属于自己的日记
- 防止数据泄露

### 数据安全
```javascript
allow update, delete: if request.auth != null 
  && request.auth.uid == resource.data.userId;
```
- 用户只能修改/删除自己的日记
- 确保数据安全

## ❗ 常见问题

### Q: 规则发布后还是报错？
A: 等待1-2分钟让规则生效，然后刷新页面重试。

### Q: 测试模式可以继续使用吗？
A: 测试模式30天后过期，建议配置正式规则。

### Q: 规则太复杂了？
A: 可以使用简化版本（仅用于测试）：

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

⚠️ **注意：简化规则允许任何人读写数据，仅用于测试！**

## 🎯 最佳实践

1. **开发阶段**：使用测试模式或简化规则
2. **生产环境**：使用完整的用户隔离规则
3. **定期检查**：监控Firebase控制台的访问日志
4. **备份规则**：保存规则配置到本地文件

## 📊 规则验证

配置完成后，你的应用应该显示：
```
☁️ 云端存储已启用，使用混合模式
✅ 同步完成: 成功 0 条, 失败 0 条
```

而不是：
```
❌ 云端连接检查失败: FirebaseError: Missing or insufficient permissions
```

---

💡 **配置完成后，你的天气日记将支持安全的云端存储和多设备同步！** 
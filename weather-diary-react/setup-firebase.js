#!/usr/bin/env node

/**
 * Firebase自动配置脚本
 * 帮助用户快速配置Firebase云端存储
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔥 Firebase配置助手');
console.log('================');
console.log('');

// 提示用户输入Firebase配置信息
const questions = [
  { key: 'REACT_APP_FIREBASE_API_KEY', prompt: '请输入API Key: ' },
  { key: 'REACT_APP_FIREBASE_AUTH_DOMAIN', prompt: '请输入Auth Domain (例如: your-project.firebaseapp.com): ' },
  { key: 'REACT_APP_FIREBASE_PROJECT_ID', prompt: '请输入Project ID: ' },
  { key: 'REACT_APP_FIREBASE_STORAGE_BUCKET', prompt: '请输入Storage Bucket (例如: your-project.appspot.com): ' },
  { key: 'REACT_APP_FIREBASE_MESSAGING_SENDER_ID', prompt: '请输入Messaging Sender ID: ' },
  { key: 'REACT_APP_FIREBASE_APP_ID', prompt: '请输入App ID: ' }
];

async function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

async function collectConfig() {
  const config = {};
  
  console.log('📋 请输入从Firebase控制台获取的配置信息：');
  console.log('(可以在Firebase控制台 → 项目设置 → 你的应用 → 配置中找到)');
  console.log('');
  
  for (const question of questions) {
    const answer = await askQuestion(question.prompt);
    if (answer) {
      config[question.key] = answer;
    }
  }
  
  return config;
}

function createEnvFile(config) {
  const envContent = `# Firebase配置文件
# 由setup-firebase.js自动生成
# 生成时间: ${new Date().toLocaleString()}

${Object.entries(config).map(([key, value]) => `${key}=${value}`).join('\n')}
`;

  const envPath = path.join(__dirname, '.env.local');
  
  try {
    fs.writeFileSync(envPath, envContent);
    console.log('✅ .env.local 文件已创建');
    return true;
  } catch (error) {
    console.error('❌ 创建.env.local文件失败:', error.message);
    return false;
  }
}

function validateConfig(config) {
  const requiredFields = [
    'REACT_APP_FIREBASE_API_KEY',
    'REACT_APP_FIREBASE_PROJECT_ID'
  ];
  
  for (const field of requiredFields) {
    if (!config[field]) {
      console.log(`❌ 缺少必需字段: ${field}`);
      return false;
    }
  }
  
  return true;
}

async function main() {
  try {
    // 检查是否已存在配置文件
    const envPath = path.join(__dirname, '.env.local');
    if (fs.existsSync(envPath)) {
      const overwrite = await askQuestion('⚠️  .env.local 文件已存在，是否覆盖？(y/N): ');
      if (overwrite.toLowerCase() !== 'y') {
        console.log('❌ 已取消配置');
        rl.close();
        return;
      }
    }
    
    // 收集配置信息
    const config = await collectConfig();
    
    // 验证配置
    if (!validateConfig(config)) {
      console.log('❌ 配置验证失败，请检查必填项');
      rl.close();
      return;
    }
    
    // 创建环境变量文件
    if (createEnvFile(config)) {
      console.log('');
      console.log('🎉 Firebase配置完成！');
      console.log('');
      console.log('📝 下一步操作：');
      console.log('1. 重启开发服务器: npm start');
      console.log('2. 打开浏览器开发者工具查看控制台');
      console.log('3. 写一条测试日记验证同步功能');
      console.log('');
      console.log('🔍 如果遇到问题，请检查：');
      console.log('- Firebase控制台中Firestore是否设置为测试模式');
      console.log('- Authentication中匿名登录是否已启用');
      console.log('- 网络连接是否正常');
    }
    
  } catch (error) {
    console.error('❌ 配置过程出错:', error.message);
  } finally {
    rl.close();
  }
}

// 运行配置程序
if (require.main === module) {
  main();
} 
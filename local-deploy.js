#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 天气日记本 - 本地部署工具\n');

const args = process.argv.slice(2);
const command = args[0] || 'help';

switch (command) {
  case 'build':
    console.log('📦 构建生产版本...');
    execSync('npm run build', { stdio: 'inherit' });
    console.log('✅ 构建完成！');
    break;

  case 'preview':
    console.log('👀 本地预览构建结果...');
    console.log('🌐 启动本地服务器: http://localhost:3000');
    console.log('💡 按 Ctrl+C 停止服务器\n');
    try {
      execSync('serve -s build -l 3000', { stdio: 'inherit' });
    } catch (error) {
      console.log('\n📋 如果没有serve，请先安装: npm install -g serve');
    }
    break;

  case 'deploy':
    console.log('🚀 部署到GitHub Pages...');
    execSync('npm run deploy', { stdio: 'inherit' });
    console.log('✅ 部署完成！');
    console.log('🌐 网站地址: https://finn-maker.github.io/FinnWeather-diary/');
    break;

  case 'full':
    console.log('🔄 完整部署流程...');
    console.log('1. 📦 构建项目...');
    execSync('npm run build', { stdio: 'inherit' });
    console.log('\n2. 👀 本地预览 (5秒)...');
    const preview = execSync('serve -s build -l 3001 &', { stdio: 'pipe' });
    setTimeout(() => {
      console.log('3. 🚀 部署到GitHub Pages...');
      execSync('npm run deploy', { stdio: 'inherit' });
      console.log('✅ 完整部署完成！');
      console.log('🌐 网站地址: https://finn-maker.github.io/FinnWeather-diary/');
    }, 5000);
    break;

  case 'dev':
    console.log('🛠️  启动开发服务器...');
    console.log('🌐 开发地址: http://localhost:3000');
    console.log('💡 按 Ctrl+C 停止服务器\n');
    execSync('npm start', { stdio: 'inherit' });
    break;

  case 'help':
  default:
    console.log('📖 使用说明:');
    console.log('');
    console.log('  node local-deploy.js <命令>');
    console.log('');
    console.log('🛠️  可用命令:');
    console.log('  build    📦 只构建生产版本');
    console.log('  preview  👀 本地预览构建结果');
    console.log('  deploy   🚀 部署到GitHub Pages');
    console.log('  full     🔄 构建+预览+部署完整流程');
    console.log('  dev      🛠️  启动开发服务器');
    console.log('  help     📖 显示此帮助信息');
    console.log('');
    console.log('💡 示例:');
    console.log('  node local-deploy.js build    # 只构建');
    console.log('  node local-deploy.js preview  # 预览构建结果');
    console.log('  node local-deploy.js deploy   # 直接部署');
    console.log('  node local-deploy.js full     # 完整流程');
    break;
} 
// Firebase配置文件
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Firebase配置 - 你需要从Firebase控制台获取这些值
const firebaseConfig = {
  // Firebase配置 - 直接配置方式
  apiKey: "AIzaSyAoNc1V1SNxvpd5Z5PpRgjZoRIDj7wsARA",
  authDomain: "weather-diary-app-69053.firebaseapp.com",
  projectId: "weather-diary-app-69053",
  storageBucket: "weather-diary-app-69053.firebasestorage.app",
  messagingSenderId: "663994075664",
  appId: "1:663994075664:web:8ffe5af1809760ccfd5895"
};

// 初始化Firebase
const app = initializeApp(firebaseConfig);

// 初始化Firestore数据库
export const db = getFirestore(app);

// 初始化身份验证
export const auth = getAuth(app);

// 检查Firebase是否已正确配置
export const isFirebaseConfigured = (): boolean => {
  return firebaseConfig.apiKey !== "your-api-key" && 
         firebaseConfig.projectId !== "your-project-id";
};

export default app; 
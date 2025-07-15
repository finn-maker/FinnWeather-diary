// Firebase配置文件
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Firebase配置 - 你需要从Firebase控制台获取这些值
const firebaseConfig = {
  // 从Firebase控制台获取配置信息
  // 访问 https://console.firebase.google.com/
  // 创建项目后在项目设置中找到这些配置
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "your-api-key",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "your-project.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "your-project-id",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "your-project.appspot.com",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "your-app-id"
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
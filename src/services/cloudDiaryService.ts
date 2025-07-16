// 云端日记存储服务
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  limit,
  doc,
  updateDoc,
  deleteDoc,
  where,
  onSnapshot,
  Timestamp
} from 'firebase/firestore';
import { 
  signInAnonymously, 
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import { db, auth, isFirebaseConfigured } from './firebaseConfig';
import { DiaryEntry } from '../types';
import { encryptDiaryEntry, decryptDiaryList } from './encryptionService';

// 用户ID存储
let currentUserId: string | null = null;

// 初始化匿名用户认证
export const initializeAuth = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!isFirebaseConfigured()) {
      reject(new Error('Firebase未配置'));
      return;
    }

    // 检查是否已有用户
    onAuthStateChanged(auth, async (user: User | null) => {
      if (user) {
        currentUserId = user.uid;
        // 保存用户ID到localStorage以便离线使用
        localStorage.setItem('weather_diary_user_id', user.uid);
        resolve(user.uid);
      } else {
        try {
          // 匿名登录
          const userCredential = await signInAnonymously(auth);
          currentUserId = userCredential.user.uid;
          localStorage.setItem('weather_diary_user_id', userCredential.user.uid);
          resolve(userCredential.user.uid);
        } catch (error) {
          console.error('匿名登录失败:', error);
          reject(error);
        }
      }
    });
  });
};

// 获取用户ID
const getUserId = (): string => {
  if (currentUserId) return currentUserId;
  
  // 从localStorage获取
  const storedUserId = localStorage.getItem('weather_diary_user_id');
  if (storedUserId) {
    currentUserId = storedUserId;
    return storedUserId;
  }
  
  throw new Error('用户未登录');
};

// 保存日记到云端 (加密版本)
export const saveCloudDiary = async (entry: Omit<DiaryEntry, 'id' | 'timestamp'>): Promise<DiaryEntry> => {
  try {
    if (!isFirebaseConfigured()) {
      throw new Error('Firebase未配置');
    }

    const userId = getUserId();
    
    // 清理数据，移除 undefined 值
    const cleanEntry = JSON.parse(JSON.stringify(entry));
    
    // 特别处理 weather.moonPhase，如果是 undefined 则设为 null
    if (cleanEntry.weather && cleanEntry.weather.moonPhase === undefined) {
      cleanEntry.weather.moonPhase = null;
    }
    
    // 🔒 加密日记内容
    const encryptedEntry = await encryptDiaryEntry(cleanEntry, userId);
    
    const diaryData = {
      ...encryptedEntry,
      userId,
      timestamp: Date.now(),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      encrypted: true // 标记为已加密
    };

    const docRef = await addDoc(collection(db, 'diaries'), diaryData);
    
    const savedEntry: DiaryEntry = {
      ...entry, // 返回原始未加密数据给客户端使用
      id: docRef.id,
      timestamp: diaryData.timestamp
    };

    console.log('🔒 加密日记已保存到云端:', docRef.id);
    return savedEntry;
  } catch (error) {
    console.error('保存到云端失败:', error);
    throw error;
  }
};

// 从云端获取日记列表
export const getCloudDiaries = async (): Promise<DiaryEntry[]> => {
  try {
    if (!isFirebaseConfigured()) {
      throw new Error('Firebase未配置');
    }

    const userId = getUserId();
    
    // 使用简单查询，避免索引问题
    const q = query(
      collection(db, 'diaries'),
      where('userId', '==', userId),
      limit(100)
    );

    const querySnapshot = await getDocs(q);
    const encryptedEntries: DiaryEntry[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      encryptedEntries.push({
        id: doc.id,
        title: data.title,
        content: data.content,
        mood: data.mood,
        weather: data.weather,
        timestamp: data.timestamp
      });
    });

    // 🔓 解密日记内容
    const decryptedEntries = await decryptDiaryList(encryptedEntries, userId);
    
    // 在客户端排序
    decryptedEntries.sort((a, b) => b.timestamp - a.timestamp);
    
    console.log(`🔓 从云端获取并解密了 ${decryptedEntries.length} 条日记`);
    return decryptedEntries;
  } catch (error) {
    console.error('从云端获取日记失败:', error);
    throw error;
  }
};

// 更新云端日记
export const updateCloudDiary = async (id: string, updates: Partial<DiaryEntry>): Promise<void> => {
  try {
    if (!isFirebaseConfigured()) {
      throw new Error('Firebase未配置');
    }

    const docRef = doc(db, 'diaries', id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now()
    });

    console.log('日记已更新:', id);
  } catch (error) {
    console.error('更新云端日记失败:', error);
    throw error;
  }
};

// 删除云端日记
export const deleteCloudDiary = async (id: string): Promise<void> => {
  try {
    if (!isFirebaseConfigured()) {
      throw new Error('Firebase未配置');
    }

    await deleteDoc(doc(db, 'diaries', id));
    console.log('日记已删除:', id);
  } catch (error) {
    console.error('删除云端日记失败:', error);
    throw error;
  }
};

// 实时监听云端数据变化
export const subscribeToCloudDiaries = (callback: (entries: DiaryEntry[]) => void): (() => void) => {
  try {
    if (!isFirebaseConfigured()) {
      throw new Error('Firebase未配置');
    }

    const userId = getUserId();
    
    // 使用简单查询，避免索引问题
    const q = query(
      collection(db, 'diaries'),
      where('userId', '==', userId),
      limit(100)
    );

    return onSnapshot(q, async (querySnapshot) => {
      const encryptedEntries: DiaryEntry[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        encryptedEntries.push({
          id: doc.id,
          title: data.title,
          content: data.content,
          mood: data.mood,
          weather: data.weather,
          timestamp: data.timestamp
        });
      });
      
      try {
        // 🔓 解密日记内容
        const decryptedEntries = await decryptDiaryList(encryptedEntries, userId);
        
        // 在客户端排序
        decryptedEntries.sort((a, b) => b.timestamp - a.timestamp);
        
        console.log(`🔓 实时更新：解密了 ${decryptedEntries.length} 条日记`);
        callback(decryptedEntries);
      } catch (decryptError) {
        console.error('实时解密失败:', decryptError);
        callback([]); // 解密失败时返回空数组
      }
    }, (error) => {
      console.error('实时监听失败:', error);
    });
  } catch (error) {
    console.error('订阅云端数据失败:', error);
    return () => {}; // 返回空的取消订阅函数
  }
};

// 同步本地数据到云端
export const syncLocalToCloud = async (): Promise<{ success: number; failed: number }> => {
  try {
    if (!isFirebaseConfigured()) {
      throw new Error('Firebase未配置');
    }

    // 获取本地数据
    const localEntries = JSON.parse(localStorage.getItem('weather_diary_entries') || '[]');
    
    if (localEntries.length === 0) {
      console.log('📄 本地无数据需要同步');
      return { success: 0, failed: 0 };
    }
    
    // 获取云端数据
    const cloudEntries = await getCloudDiaries();
    
    // 使用多重条件进行更精确的去重
    const cloudSignatures = new Set();
    const cloudTitleTime = new Set();
    
    cloudEntries.forEach(entry => {
      // 方法1：内容签名去重
      const contentSignature = `${entry.timestamp}_${entry.title}_${entry.content.substring(0, 50)}`;
      cloudSignatures.add(contentSignature);
      
      // 方法2：标题+时间去重（精确到分钟）
      const entryDate = new Date(entry.timestamp);
      const timeToMinute = new Date(entryDate.getFullYear(), entryDate.getMonth(), entryDate.getDate(), entryDate.getHours(), entryDate.getMinutes()).getTime();
      const titleTimeSignature = `${entry.title}_${timeToMinute}`;
      cloudTitleTime.add(titleTimeSignature);
    });

    let success = 0;
    let failed = 0;
    let skipped = 0;

    // 上传本地独有的数据
    for (const localEntry of localEntries) {
      // 多重检查避免重复
      const contentSignature = `${localEntry.timestamp}_${localEntry.title}_${localEntry.content.substring(0, 50)}`;
      
      const entryDate = new Date(localEntry.timestamp);
      const timeToMinute = new Date(entryDate.getFullYear(), entryDate.getMonth(), entryDate.getDate(), entryDate.getHours(), entryDate.getMinutes()).getTime();
      const titleTimeSignature = `${localEntry.title}_${timeToMinute}`;
      
      // 如果任一签名匹配，则跳过上传
      if (cloudSignatures.has(contentSignature) || cloudTitleTime.has(titleTimeSignature)) {
        skipped++;
        continue;
      }
      
      try {
        await saveCloudDiary({
          title: localEntry.title,
          content: localEntry.content,
          mood: localEntry.mood,
          weather: localEntry.weather
        });
        success++;
        console.log(`📤 上传日记: ${localEntry.title}`);
      } catch (error) {
        console.error('同步失败:', localEntry.title, error);
        failed++;
      }
    }

    console.log(`📊 同步结果: 成功 ${success} 条, 失败 ${failed} 条, 跳过 ${skipped} 条`);
    return { success, failed };
  } catch (error) {
    console.error('同步本地到云端失败:', error);
    throw error;
  }
};

// 检查云端连接状态
export const checkCloudConnection = async (): Promise<boolean> => {
  try {
    if (!isFirebaseConfigured()) {
      return false;
    }

    // 尝试初始化认证来测试连接
    await initializeAuth();
    console.log('✅ 云端连接检查成功');
    return true;
  } catch (error) {
    console.error('云端连接检查失败:', error);
    return false;
  }
}; 
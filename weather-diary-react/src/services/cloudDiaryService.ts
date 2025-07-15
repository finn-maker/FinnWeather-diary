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

// 保存日记到云端
export const saveCloudDiary = async (entry: Omit<DiaryEntry, 'id' | 'timestamp'>): Promise<DiaryEntry> => {
  try {
    if (!isFirebaseConfigured()) {
      throw new Error('Firebase未配置，使用本地存储');
    }

    const userId = getUserId();
    const diaryData = {
      ...entry,
      userId,
      timestamp: Date.now(),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    const docRef = await addDoc(collection(db, 'diaries'), diaryData);
    
    const savedEntry: DiaryEntry = {
      ...entry,
      id: docRef.id,
      timestamp: diaryData.timestamp
    };

    console.log('日记已保存到云端:', docRef.id);
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
    const q = query(
      collection(db, 'diaries'),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(100)
    );

    const querySnapshot = await getDocs(q);
    const entries: DiaryEntry[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      entries.push({
        id: doc.id,
        title: data.title,
        content: data.content,
        mood: data.mood,
        weather: data.weather,
        timestamp: data.timestamp
      });
    });

    console.log(`从云端获取到 ${entries.length} 条日记`);
    return entries;
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
    const q = query(
      collection(db, 'diaries'),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(100)
    );

    return onSnapshot(q, (querySnapshot) => {
      const entries: DiaryEntry[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        entries.push({
          id: doc.id,
          title: data.title,
          content: data.content,
          mood: data.mood,
          weather: data.weather,
          timestamp: data.timestamp
        });
      });
      
      console.log(`实时更新：获取到 ${entries.length} 条日记`);
      callback(entries);
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
    
    // 获取云端数据
    const cloudEntries = await getCloudDiaries();
    const cloudIds = new Set(cloudEntries.map(entry => entry.id));

    let success = 0;
    let failed = 0;

    // 上传本地独有的数据
    for (const localEntry of localEntries) {
      if (!cloudIds.has(localEntry.id)) {
        try {
          await saveCloudDiary({
            title: localEntry.title,
            content: localEntry.content,
            mood: localEntry.mood,
            weather: localEntry.weather
          });
          success++;
        } catch (error) {
          console.error('同步失败:', error);
          failed++;
        }
      }
    }

    console.log(`同步完成: 成功 ${success} 条, 失败 ${failed} 条`);
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

    await getDocs(query(collection(db, 'diaries'), limit(1)));
    return true;
  } catch (error) {
    console.error('云端连接检查失败:', error);
    return false;
  }
}; 
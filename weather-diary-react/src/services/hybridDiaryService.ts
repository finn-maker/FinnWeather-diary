// 混合存储服务 - 同时支持本地和云端存储
import { DiaryEntry } from '../types';
import { 
  saveDiaryEntry as saveLocalDiary,
  getDiaryEntries as getLocalDiaries,
  deleteDiaryEntry as deleteLocalDiary,
  updateDiaryEntry as updateLocalDiary
} from './diaryService';
import { 
  saveCloudDiary,
  getCloudDiaries,
  deleteCloudDiary,
  updateCloudDiary,
  initializeAuth,
  syncLocalToCloud,
  checkCloudConnection,
  subscribeToCloudDiaries
} from './cloudDiaryService';
import { isFirebaseConfigured } from './firebaseConfig';

// 存储模式
export type StorageMode = 'local' | 'cloud' | 'hybrid';

// 存储状态
interface StorageStatus {
  mode: StorageMode;
  cloudAvailable: boolean;
  lastSync: number | null;
  syncing: boolean;
}

// 全局存储状态
let storageStatus: StorageStatus = {
  mode: 'local',
  cloudAvailable: false,
  lastSync: null,
  syncing: false
};

// 云端数据监听取消函数
let unsubscribeCloudListener: (() => void) | null = null;

// 初始化混合存储
export const initializeHybridStorage = async (): Promise<StorageStatus> => {
  try {
    // 检查Firebase配置
    if (!isFirebaseConfigured()) {
      console.log('📱 Firebase未配置，使用本地存储模式');
      storageStatus.mode = 'local';
      return storageStatus;
    }

    // 检查网络连接
    const cloudConnected = await checkCloudConnection();
    if (!cloudConnected) {
      console.log('🔌 云端连接失败，使用本地存储模式');
      storageStatus.mode = 'local';
      return storageStatus;
    }

    // 初始化用户认证
    try {
      await initializeAuth();
      storageStatus.cloudAvailable = true;
      storageStatus.mode = 'hybrid';
      
      console.log('☁️ 云端存储已启用，使用混合模式');
      
      // 启动数据同步
      await performInitialSync();
      
      return storageStatus;
    } catch (authError) {
      console.error('认证失败，降级到本地模式:', authError);
      storageStatus.mode = 'local';
      return storageStatus;
    }
  } catch (error) {
    console.error('初始化存储失败:', error);
    storageStatus.mode = 'local';
    return storageStatus;
  }
};

// 执行初始同步
const performInitialSync = async (): Promise<void> => {
  if (storageStatus.syncing) return;
  
  try {
    storageStatus.syncing = true;
    console.log('🔄 开始初始同步...');
    
    const syncResult = await syncLocalToCloud();
    storageStatus.lastSync = Date.now();
    
    console.log(`✅ 同步完成: 成功 ${syncResult.success} 条, 失败 ${syncResult.failed} 条`);
  } catch (error) {
    console.error('初始同步失败:', error);
  } finally {
    storageStatus.syncing = false;
  }
};

// 保存日记 (混合模式)
export const saveHybridDiary = async (entry: Omit<DiaryEntry, 'id' | 'timestamp'>): Promise<DiaryEntry> => {
  // 始终先保存到本地
  const localEntry = saveLocalDiary(entry);
  
  // 如果云端可用，尝试保存到云端
  if (storageStatus.cloudAvailable && storageStatus.mode === 'hybrid') {
    try {
      const cloudEntry = await saveCloudDiary(entry);
      console.log('✅ 日记已同时保存到本地和云端');
      return cloudEntry; // 返回云端ID
    } catch (error) {
      console.warn('⚠️ 云端保存失败，仅保存到本地:', error);
      // 降级到本地模式
      storageStatus.cloudAvailable = false;
      return localEntry;
    }
  }
  
  return localEntry;
};

// 获取日记列表 (混合模式)
export const getHybridDiaries = async (): Promise<DiaryEntry[]> => {
  // 如果云端可用，优先从云端获取
  if (storageStatus.cloudAvailable && storageStatus.mode === 'hybrid') {
    try {
      const cloudEntries = await getCloudDiaries();
      
      // 同时获取本地数据进行合并
      const localEntries = getLocalDiaries();
      
      // 合并数据（云端优先，去重）
      const mergedEntries = mergeEntries(cloudEntries, localEntries);
      
      console.log(`📊 获取数据: 云端 ${cloudEntries.length} 条, 本地 ${localEntries.length} 条, 合并后 ${mergedEntries.length} 条`);
      return mergedEntries;
    } catch (error) {
      console.warn('⚠️ 云端获取失败，降级到本地:', error);
      storageStatus.cloudAvailable = false;
    }
  }
  
  // 从本地获取
  return getLocalDiaries();
};

// 删除日记 (混合模式)
export const deleteHybridDiary = async (id: string): Promise<void> => {
  // 先从本地删除
  deleteLocalDiary(id);
  
  // 如果云端可用，尝试从云端删除
  if (storageStatus.cloudAvailable && storageStatus.mode === 'hybrid') {
    try {
      await deleteCloudDiary(id);
      console.log('✅ 日记已从本地和云端删除');
    } catch (error) {
      console.warn('⚠️ 云端删除失败:', error);
    }
  }
};

// 更新日记 (混合模式)
export const updateHybridDiary = async (id: string, updates: Partial<DiaryEntry>): Promise<DiaryEntry | null> => {
  // 先更新本地
  const localResult = updateLocalDiary(id, updates);
  
  // 如果云端可用，尝试更新云端
  if (storageStatus.cloudAvailable && storageStatus.mode === 'hybrid') {
    try {
      await updateCloudDiary(id, updates);
      console.log('✅ 日记已在本地和云端更新');
    } catch (error) {
      console.warn('⚠️ 云端更新失败:', error);
    }
  }
  
  return localResult;
};

// 合并本地和云端数据
const mergeEntries = (cloudEntries: DiaryEntry[], localEntries: DiaryEntry[]): DiaryEntry[] => {
  const entryMap = new Map<string, DiaryEntry>();
  
  // 先加入本地数据
  localEntries.forEach(entry => {
    entryMap.set(entry.id, entry);
  });
  
  // 云端数据覆盖本地数据（云端优先）
  cloudEntries.forEach(entry => {
    entryMap.set(entry.id, entry);
  });
  
  // 按时间戳排序
  return Array.from(entryMap.values()).sort((a, b) => b.timestamp - a.timestamp);
};

// 手动同步到云端
export const manualSyncToCloud = async (): Promise<{ success: number; failed: number }> => {
  if (!storageStatus.cloudAvailable) {
    throw new Error('云端存储不可用');
  }
  
  if (storageStatus.syncing) {
    throw new Error('正在同步中，请稍候');
  }
  
  try {
    storageStatus.syncing = true;
    const result = await syncLocalToCloud();
    storageStatus.lastSync = Date.now();
    return result;
  } finally {
    storageStatus.syncing = false;
  }
};

// 获取存储状态
export const getStorageStatus = (): StorageStatus => {
  return { ...storageStatus };
};

// 切换存储模式
export const switchStorageMode = async (mode: StorageMode): Promise<void> => {
  if (mode === 'cloud' && !storageStatus.cloudAvailable) {
    throw new Error('云端存储不可用');
  }
  
  storageStatus.mode = mode;
  console.log(`📝 存储模式已切换到: ${mode}`);
  
  // 如果切换到混合模式，启动实时监听
  if (mode === 'hybrid' && storageStatus.cloudAvailable) {
    startCloudListener();
  } else {
    stopCloudListener();
  }
};

// 启动云端数据监听
const startCloudListener = (): void => {
  if (unsubscribeCloudListener) {
    stopCloudListener();
  }
  
  try {
    unsubscribeCloudListener = subscribeToCloudDiaries((cloudEntries) => {
      console.log('🔄 云端数据已更新，触发UI刷新');
      // 这里可以通过事件系统通知UI组件更新
      window.dispatchEvent(new CustomEvent('cloudDataUpdated', { 
        detail: { entries: cloudEntries } 
      }));
    });
    
    console.log('👀 云端数据监听已启动');
  } catch (error) {
    console.error('启动云端监听失败:', error);
  }
};

// 停止云端数据监听
const stopCloudListener = (): void => {
  if (unsubscribeCloudListener) {
    unsubscribeCloudListener();
    unsubscribeCloudListener = null;
    console.log('👀 云端数据监听已停止');
  }
};

// 检查是否需要同步
export const shouldSync = (): boolean => {
  if (!storageStatus.cloudAvailable || storageStatus.mode === 'local') {
    return false;
  }
  
  // 如果从未同步过，需要同步
  if (!storageStatus.lastSync) {
    return true;
  }
  
  // 如果超过5分钟未同步，需要同步
  const fiveMinutes = 5 * 60 * 1000;
  return (Date.now() - storageStatus.lastSync) > fiveMinutes;
};

// 强制重新初始化云端连接
export const reinitializeCloud = async (): Promise<boolean> => {
  try {
    console.log('🔄 重新初始化云端连接...');
    const connected = await checkCloudConnection();
    
    if (connected) {
      await initializeAuth();
      storageStatus.cloudAvailable = true;
      storageStatus.mode = 'hybrid';
      console.log('✅ 云端连接已恢复');
      return true;
    } else {
      console.log('❌ 云端连接失败');
      return false;
    }
  } catch (error) {
    console.error('重新初始化失败:', error);
    return false;
  }
};

// 清理资源
export const cleanupHybridStorage = (): void => {
  stopCloudListener();
  console.log('🧹 混合存储资源已清理');
};

// 导出存储状态常量
export const STORAGE_MODES = {
  LOCAL: 'local' as StorageMode,
  CLOUD: 'cloud' as StorageMode,
  HYBRID: 'hybrid' as StorageMode
} as const; 
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

// 缓存的合并数据
let cachedMergedEntries: DiaryEntry[] | null = null;
let lastCacheTime: number = 0;
const CACHE_DURATION = 30000; // 30秒缓存

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
      
      // 检查是否需要初始同步（仅在首次使用时）
      if (shouldPerformInitialSync()) {
        console.log('🔄 检测到需要初始同步，检查云端数据...');
        
        // 先检查云端是否已有数据
        try {
          const cloudEntries = await getCloudDiaries();
          if (cloudEntries.length > 0) {
            console.log(`☁️ 云端已有 ${cloudEntries.length} 条数据，跳过上传同步`);
            // 标记已完成初始同步，但不执行上传
            localStorage.setItem('hybrid_storage_initialized', 'true');
            localStorage.setItem('last_sync_timestamp', Date.now().toString());
          } else {
            console.log('📤 云端无数据，开始同步本地数据...');
            await performInitialSync();
            // 标记已完成初始同步
            localStorage.setItem('hybrid_storage_initialized', 'true');
          }
        } catch (cloudError) {
          console.warn('检查云端数据失败，尝试同步:', cloudError);
          await performInitialSync();
          localStorage.setItem('hybrid_storage_initialized', 'true');
        }
      } else {
        console.log('✅ 云端存储已初始化，跳过初始同步');
      }
      
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

// 检查是否需要执行初始同步
const shouldPerformInitialSync = (): boolean => {
  // 首先检查是否有同步时间戳记录 - 最可靠的标记
  const lastSyncTimestamp = localStorage.getItem('last_sync_timestamp');
  if (lastSyncTimestamp) {
    const lastSyncTime = parseInt(lastSyncTimestamp);
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000); // 24小时前
    
    // 如果最近24小时内同步过，不需要再次同步
    if (lastSyncTime > oneDayAgo) {
      console.log('🔍 检查同步需求: 最近已同步过，无需重复同步');
      return false;
    }
  }
  
  // 检查是否有本地数据需要上传
  const localEntries = getLocalDiaries();
  if (localEntries.length === 0) {
    console.log('🔍 检查同步需求: 本地无数据，无需同步');
    return false;
  }
  
  // 检查初始化标记
  const hasInitialized = localStorage.getItem('hybrid_storage_initialized');
  if (hasInitialized && lastSyncTimestamp) {
    console.log('🔍 检查同步需求: 已初始化且有同步记录，无需重复同步');
    return false;
  }
  
  console.log('🔍 检查同步需求: 需要执行初始同步');
  return true;
};

// 同步锁定机制 - 防止短时间内重复同步
let lastSyncAttempt = 0;
const SYNC_COOLDOWN = 30 * 1000; // 30秒冷却时间

// 执行初始同步
const performInitialSync = async (): Promise<void> => {
  const now = Date.now();
  
  // 检查冷却时间
  if (now - lastSyncAttempt < SYNC_COOLDOWN) {
    console.log('🚫 同步冷却中，跳过重复同步');
    return;
  }
  
  if (storageStatus.syncing) {
    console.log('⚠️ 正在同步中，跳过重复同步');
    return;
  }
  
  try {
    lastSyncAttempt = now;
    storageStatus.syncing = true;
    console.log('🔄 开始初始同步...');
    
    const syncResult = await syncLocalToCloud();
    const currentTime = Date.now();
    
    storageStatus.lastSync = currentTime;
    localStorage.setItem('last_sync_timestamp', currentTime.toString());
    
    console.log(`✅ 同步完成: 成功 ${syncResult.success} 条, 失败 ${syncResult.failed} 条`);
  } catch (error) {
    console.error('初始同步失败:', error);
  } finally {
    storageStatus.syncing = false;
  }
};

// 清除缓存
const clearCache = (): void => {
  cachedMergedEntries = null;
  lastCacheTime = 0;
  console.log('🧹 已清除日记缓存');
};

// 保存日记 (混合模式)
export const saveHybridDiary = async (entry: Omit<DiaryEntry, 'id' | 'timestamp'>): Promise<DiaryEntry> => {
  // 清除缓存
  clearCache();
  
  // 如果云端可用，优先保存到云端
  if (storageStatus.cloudAvailable && storageStatus.mode === 'hybrid') {
    try {
      const cloudEntry = await saveCloudDiary(entry);
      console.log('✅ 日记已保存到云端（混合模式）');
      
      // 更新最后同步时间
      storageStatus.lastSync = Date.now();
      localStorage.setItem('last_sync_timestamp', storageStatus.lastSync.toString());
      
      return cloudEntry;
    } catch (error) {
      console.warn('⚠️ 云端保存失败，降级到本地保存:', error);
      // 降级到本地模式
      storageStatus.cloudAvailable = false;
      const localEntry = saveLocalDiary(entry);
      console.log('✅ 日记已保存到本地（降级模式）');
      
      // 尝试重新连接并同步
      tryAutoReconnectAndSync();
      
      return localEntry;
    }
  }
  
  // 纯本地模式
  const localEntry = saveLocalDiary(entry);
  console.log('✅ 日记已保存到本地');
  
  // 如果Firebase已配置但云端不可用，尝试自动同步
  if (isFirebaseConfigured() && !storageStatus.cloudAvailable) {
    tryAutoReconnectAndSync();
  }
  
  return localEntry;
};

// 自动重连和同步（后台执行）
const tryAutoReconnectAndSync = (): void => {
  // 避免重复执行
  if (storageStatus.syncing) {
    console.log('⚠️ 同步正在进行中，跳过自动同步');
    return;
  }

  // 延迟执行，避免阻塞UI
  setTimeout(async () => {
    try {
      console.log('🔄 尝试自动重连云端...');
      const reconnected = await reinitializeCloud();
      
      if (reconnected && storageStatus.cloudAvailable) {
        console.log('✅ 云端重连成功，开始自动同步...');
        
        // 检查是否有数据需要同步
        const localEntries = getLocalDiaries();
        if (localEntries.length > 0) {
          // 检查是否最近刚同步过
          const lastSyncTime = localStorage.getItem('last_sync_timestamp');
          const now = Date.now();
          if (lastSyncTime && (now - parseInt(lastSyncTime)) < (10 * 60 * 1000)) { // 10分钟内
            console.log('🚫 最近已同步过，跳过自动同步');
            return;
          }
          
          storageStatus.syncing = true;
          try {
            // 先检查云端数据，避免重复上传
            const cloudEntries = await getCloudDiaries();
            if (cloudEntries.length >= localEntries.length) {
              console.log('☁️ 云端数据完整，跳过自动同步');
              storageStatus.lastSync = now;
              localStorage.setItem('last_sync_timestamp', now.toString());
              return;
            }
            
            const result = await syncLocalToCloud();
            storageStatus.lastSync = now;
            localStorage.setItem('last_sync_timestamp', now.toString());
            console.log(`🚀 自动同步完成: 成功 ${result.success} 条, 失败 ${result.failed} 条`);
          } catch (syncError) {
            console.error('自动同步失败:', syncError);
          } finally {
            storageStatus.syncing = false;
          }
        }
      } else {
        console.log('❌ 云端重连失败，将在下次保存时重试');
      }
    } catch (error) {
      console.error('自动重连过程中出错:', error);
    }
  }, 2000); // 延迟2秒执行
};

// 获取日记列表 (混合模式)
export const getHybridDiaries = async (): Promise<DiaryEntry[]> => {
  // 如果有缓存且未过期，直接返回缓存
  const now = Date.now();
  if (cachedMergedEntries && (now - lastCacheTime) < CACHE_DURATION) {
    console.log('📚 使用缓存的日记数据');
    return cachedMergedEntries;
  }

  // 如果云端可用，优先从云端获取
  if (storageStatus.cloudAvailable && storageStatus.mode === 'hybrid') {
    try {
      const cloudEntries = await getCloudDiaries();
      console.log(`📊 混合模式: 从云端获取 ${cloudEntries.length} 条日记`);
      
      // 更新缓存
      cachedMergedEntries = cloudEntries;
      lastCacheTime = now;
      
      return cloudEntries;
    } catch (error) {
      console.warn('⚠️ 云端获取失败，降级到本地:', error);
      storageStatus.cloudAvailable = false;
    }
  }
  
  // 从本地获取
  const localEntries = getLocalDiaries();
  console.log(`📊 本地模式: 获取 ${localEntries.length} 条日记`);
  
  // 更新缓存
  cachedMergedEntries = localEntries;
  lastCacheTime = now;
  
  return localEntries;
};

// 删除日记 (混合模式) - 优化版本
export const deleteHybridDiary = async (id: string): Promise<void> => {
  // 清除缓存（立即执行，提供即时反馈）
  clearCache();
  
  // 立即从本地删除（乐观更新）
  deleteLocalDiary(id);
  console.log('✅ 日记已从本地删除');
  
  // 异步从云端删除，不阻塞UI
  if (storageStatus.cloudAvailable && storageStatus.mode === 'hybrid') {
    // 在后台异步删除云端数据
    deleteCloudDiary(id).then(() => {
      console.log('✅ 日记已从云端删除');
    }).catch((error) => {
      console.warn('⚠️ 云端删除失败，但本地已删除:', error);
      // 可以考虑添加重试逻辑或通知用户
    });
  }
};

// 更新日记 (混合模式)
export const updateHybridDiary = async (id: string, updates: Partial<DiaryEntry>): Promise<DiaryEntry | null> => {
  // 清除缓存
  clearCache();
  
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
  const signatureMap = new Map<string, DiaryEntry>();
  
  // 生成内容签名函数
  const generateSignature = (entry: DiaryEntry): string => {
    return `${entry.timestamp}_${entry.title}_${entry.content.substring(0, 50)}`;
  };
  
  // 先加入本地数据
  localEntries.forEach(entry => {
    const signature = generateSignature(entry);
    entryMap.set(entry.id, entry);
    signatureMap.set(signature, entry);
  });
  
  // 云端数据处理：ID优先覆盖，内容签名去重
  cloudEntries.forEach(entry => {
    const signature = generateSignature(entry);
    
    // 如果内容签名已存在，说明是重复内容
    if (signatureMap.has(signature)) {
      const existingEntry = signatureMap.get(signature)!;
      
      // 如果云端条目更新，则用云端版本替换
      if (entry.timestamp >= existingEntry.timestamp) {
        // 移除旧的本地条目
        entryMap.delete(existingEntry.id);
        // 添加云端条目
        entryMap.set(entry.id, entry);
        signatureMap.set(signature, entry);
      }
      // 否则保留本地版本，不添加云端重复项
    } else {
      // 新的云端条目
      entryMap.set(entry.id, entry);
      signatureMap.set(signature, entry);
    }
  });
  
  // 按时间戳排序
  const result = Array.from(entryMap.values()).sort((a, b) => b.timestamp - a.timestamp);
  
  console.log(`🔄 数据合并: 云端 ${cloudEntries.length} 条, 本地 ${localEntries.length} 条, 去重后 ${result.length} 条`);
  
  return result;
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

// 重置存储状态（调试用）
export const resetStorageState = (): void => {
  localStorage.removeItem('hybrid_storage_initialized');
  localStorage.removeItem('last_sync_timestamp');
  clearCache();
  
  // 重置内存状态
  storageStatus.lastSync = null;
  storageStatus.syncing = false;
  
  console.log('🔄 存储状态已重置');
};

// 清理资源
export const cleanupHybridStorage = (): void => {
  stopCloudListener();
  clearCache();
  console.log('🧹 混合存储资源已清理');
};

// 导出存储状态常量
export const STORAGE_MODES = {
  LOCAL: 'local' as StorageMode,
  CLOUD: 'cloud' as StorageMode,
  HYBRID: 'hybrid' as StorageMode
} as const; 
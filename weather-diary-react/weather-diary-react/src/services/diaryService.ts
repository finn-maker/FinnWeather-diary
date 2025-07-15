import { DiaryEntry, WeatherData } from '../types';

const STORAGE_KEY = 'weather_diary_entries';

// 保存日记条目
export const saveDiaryEntry = (entry: Omit<DiaryEntry, 'id' | 'timestamp'>): DiaryEntry => {
  const newEntry: DiaryEntry = {
    ...entry,
    id: generateId(),
    timestamp: Date.now(),
  };

  const entries = getDiaryEntries();
  entries.unshift(newEntry);
  
  // 只保留最近100条记录
  const trimmedEntries = entries.slice(0, 100);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmedEntries));
  
  return newEntry;
};

// 获取所有日记条目
export const getDiaryEntries = (): DiaryEntry[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('读取日记数据失败:', error);
    return [];
  }
};

// 删除日记条目
export const deleteDiaryEntry = (id: string): void => {
  const entries = getDiaryEntries();
  const filteredEntries = entries.filter(entry => entry.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredEntries));
};

// 更新日记条目
export const updateDiaryEntry = (id: string, updates: Partial<DiaryEntry>): DiaryEntry | null => {
  const entries = getDiaryEntries();
  const index = entries.findIndex(entry => entry.id === id);
  
  if (index === -1) return null;
  
  entries[index] = { ...entries[index], ...updates };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  
  return entries[index];
};

// 清空所有日记
export const clearAllDiaries = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};

// 生成唯一ID
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// 格式化日期
export const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// 获取当前日期字符串
export const getCurrentDateString = (): string => {
  const now = new Date();
  return now.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });
}; 

// 导出所有日记数据
export const exportDiaryData = (): string => {
  const entries = getDiaryEntries();
  const exportData = {
    version: '2.1.0',
    exportTime: new Date().toISOString(),
    totalEntries: entries.length,
    entries: entries
  };
  return JSON.stringify(exportData, null, 2);
};

// 导入日记数据
export const importDiaryData = (jsonData: string): { success: boolean; message: string; importedCount: number } => {
  try {
    const importData = JSON.parse(jsonData);
    
    // 验证数据格式
    if (!importData.entries || !Array.isArray(importData.entries)) {
      return { success: false, message: '数据格式不正确', importedCount: 0 };
    }

    // 获取现有数据
    const existingEntries = getDiaryEntries();
    const existingIds = new Set(existingEntries.map(entry => entry.id));
    
    // 过滤重复数据
    const newEntries = importData.entries.filter((entry: DiaryEntry) => 
      entry.id && entry.title && entry.content && !existingIds.has(entry.id)
    );

    if (newEntries.length === 0) {
      return { success: false, message: '没有发现新的日记数据', importedCount: 0 };
    }

    // 合并数据
    const mergedEntries = [...newEntries, ...existingEntries].slice(0, 100);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mergedEntries));
    
    return { 
      success: true, 
      message: `成功导入 ${newEntries.length} 条日记`,
      importedCount: newEntries.length
    };
  } catch (error) {
    return { 
      success: false, 
      message: '数据解析失败，请检查文件格式', 
      importedCount: 0
    };
  }
};

// 下载备份文件
export const downloadBackup = (): void => {
  const data = exportDiaryData();
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `天气日记备份_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}; 
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
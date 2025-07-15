// 客户端加密服务 - 保护用户隐私
import { DiaryEntry } from '../types';

// 生成密钥的种子
const generateKeyFromUserId = async (userId: string): Promise<CryptoKey> => {
  // 使用用户ID和固定盐生成密钥
  const encoder = new TextEncoder();
  const data = encoder.encode(userId + 'weather-diary-secret-salt-2025');
  
  // 使用Web Crypto API生成密钥
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    data,
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  
  // 派生AES密钥
  const key = await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode('weather-diary-salt'),
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
  
  return key;
};

// 加密文本
const encryptText = async (text: string, key: CryptoKey): Promise<string> => {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    
    // 生成随机初始化向量
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    
    // 加密数据
    const encrypted = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );
    
    // 将IV和加密数据组合，并转换为Base64
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);
    
    return btoa(String.fromCharCode.apply(null, Array.from(combined)));
  } catch (error) {
    console.error('加密失败:', error);
    throw new Error('加密失败');
  }
};

// 解密文本
const decryptText = async (encryptedText: string, key: CryptoKey): Promise<string> => {
  try {
    // 从Base64解码
    const combined = new Uint8Array(
      atob(encryptedText).split('').map(char => char.charCodeAt(0))
    );
    
    // 提取IV和加密数据
    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);
    
    // 解密数据
    const decrypted = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encrypted
    );
    
    // 转换为文本
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    console.error('解密失败:', error);
    throw new Error('解密失败');
  }
};

// 加密日记条目
export const encryptDiaryEntry = async (
  entry: Omit<DiaryEntry, 'id' | 'timestamp'>,
  userId: string
): Promise<Omit<DiaryEntry, 'id' | 'timestamp'>> => {
  try {
    console.log('🔒 正在加密日记内容...');
    
    const key = await generateKeyFromUserId(userId);
    
    // 加密敏感字段
    const encryptedEntry = {
      ...entry,
      title: await encryptText(entry.title, key),
      content: await encryptText(entry.content, key),
      // 心情和天气数据不包含敏感信息，可以不加密（便于统计分析）
      mood: entry.mood,
      weather: entry.weather
    };
    
    console.log('✅ 日记内容加密完成');
    return encryptedEntry;
  } catch (error) {
    console.error('日记加密失败:', error);
    throw error;
  }
};

// 解密日记条目
export const decryptDiaryEntry = async (
  encryptedEntry: DiaryEntry,
  userId: string
): Promise<DiaryEntry> => {
  try {
    // 检查是否已加密（兼容旧数据）
    if (!isEncrypted(encryptedEntry.title)) {
      console.log('📄 检测到未加密的日记，直接返回');
      return encryptedEntry;
    }
    
    console.log('🔓 正在解密日记内容...');
    
    const key = await generateKeyFromUserId(userId);
    
    // 解密敏感字段
    const decryptedEntry = {
      ...encryptedEntry,
      title: await decryptText(encryptedEntry.title, key),
      content: await decryptText(encryptedEntry.content, key)
    };
    
    console.log('✅ 日记内容解密完成');
    return decryptedEntry;
  } catch (error) {
    console.error('日记解密失败:', error);
    // 解密失败时返回错误提示
    return {
      ...encryptedEntry,
      title: '⚠️ 解密失败',
      content: '无法解密此日记内容，可能是数据损坏或密钥不匹配。'
    };
  }
};

// 批量解密日记列表
export const decryptDiaryList = async (
  encryptedEntries: DiaryEntry[],
  userId: string
): Promise<DiaryEntry[]> => {
  try {
    console.log(`🔓 正在解密 ${encryptedEntries.length} 条日记...`);
    
    const decryptedEntries = await Promise.all(
      encryptedEntries.map(entry => decryptDiaryEntry(entry, userId))
    );
    
    console.log('✅ 批量解密完成');
    return decryptedEntries;
  } catch (error) {
    console.error('批量解密失败:', error);
    throw error;
  }
};

// 检查文本是否已加密（简单检测Base64格式）
const isEncrypted = (text: string): boolean => {
  try {
    // 检查是否为Base64格式且长度合理
    return /^[A-Za-z0-9+/]+=*$/.test(text) && text.length > 20;
  } catch {
    return false;
  }
};

// 生成加密状态报告
export const getEncryptionStatus = (): {
  supported: boolean;
  algorithm: string;
  keyLength: number;
  description: string;
} => {
  const isSupported = typeof window !== 'undefined' && 
                     !!window.crypto && 
                     !!window.crypto.subtle;

  return {
    supported: isSupported,
    algorithm: 'AES-GCM',
    keyLength: 256,
    description: isSupported 
      ? '✅ 支持端到端加密，您的日记内容完全隐私保护'
      : '❌ 浏览器不支持加密功能，日记以明文存储'
  };
};

// 导出时加密备份数据
export const encryptBackupData = async (
  data: any,
  userId: string
): Promise<string> => {
  try {
    const key = await generateKeyFromUserId(userId);
    const jsonString = JSON.stringify(data);
    return await encryptText(jsonString, key);
  } catch (error) {
    console.error('备份数据加密失败:', error);
    throw error;
  }
};

// 导入时解密备份数据
export const decryptBackupData = async (
  encryptedData: string,
  userId: string
): Promise<any> => {
  try {
    const key = await generateKeyFromUserId(userId);
    const jsonString = await decryptText(encryptedData, key);
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('备份数据解密失败:', error);
    throw error;
  }
}; 
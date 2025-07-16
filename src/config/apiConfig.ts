// API配置文件
// 请在此处配置你的API密钥

export const API_CONFIG = {
  // 和风天气API配置
  qweather: {
    // 请替换为你的和风天气API密钥
    // 免费版每天1000次请求：https://dev.qweather.com/
    key: process.env.REACT_APP_QWEATHER_KEY || '8787bc4a233e41ef8fc23d5294855db4',
    baseUrl: 'https://devapi.qweather.com/v7',
    timeout: 8000
  },
  
  // 高德地图API配置（推荐全局使用）
  amap: {
    // 高德地图API密钥，免费版每天30万次请求
    // 申请地址：https://console.amap.com/dev/key/app
    key: process.env.REACT_APP_AMAP_KEY || '908d63a6a6c350651cc0373a1745356c',
    baseUrl: 'https://restapi.amap.com/v3',
    timeout: 8000
  },
  
  // 备用天气API
  wttr: {
    baseUrl: 'https://wttr.in',
    timeout: 15000
  }
};

// 验证API密钥是否已配置
export const validateApiConfig = () => {
  const issues: string[] = [];
  const warnings: string[] = [];
  
  if (!API_CONFIG.amap.key) {
    warnings.push('高德地图API密钥未配置，建议配置以获得最佳体验');
  }
  
  if (!API_CONFIG.qweather.key || API_CONFIG.qweather.key === 'YOUR_QWEATHER_API_KEY_HERE') {
    warnings.push('和风天气API密钥未配置，作为备用API建议配置');
  }
  
  // 至少需要一个主要API配置
  if (!API_CONFIG.amap.key && (!API_CONFIG.qweather.key || API_CONFIG.qweather.key === 'YOUR_QWEATHER_API_KEY_HERE')) {
    issues.push('未配置任何主要API密钥，建议至少配置高德地图或和风天气API');
  }
  
  return {
    isValid: issues.length === 0,
    issues,
    warnings
  };
};

// 获取当前使用的API配置信息
export const getApiInfo = () => {
  const validation = validateApiConfig();
  
  return {
    qweather: {
      configured: !!API_CONFIG.qweather.key && API_CONFIG.qweather.key !== 'YOUR_QWEATHER_API_KEY_HERE',
      endpoint: API_CONFIG.qweather.baseUrl
    },
    amap: {
      configured: !!API_CONFIG.amap.key,
      endpoint: API_CONFIG.amap.baseUrl
    },
    validation
  };
}; 
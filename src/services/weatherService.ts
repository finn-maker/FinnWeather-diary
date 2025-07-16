import { WeatherData, MoonPhase, MOON_PHASE_ICONS } from '../types';
import { calculateMoonPhase } from './moonPhaseService';

// 获取当前位置
const getCurrentPosition = (): Promise<GeolocationPosition> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('浏览器不支持地理位置'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      resolve,
      reject,
      { timeout: 10000, enableHighAccuracy: true }
    );
  });
};

// 判断是否为夜晚
const isNightTime = (date: Date): boolean => {
  const hour = date.getHours();
  
  // 晚上6点到早上6点算作夜晚
  const isNightByTime = hour >= 18 || hour < 6;
  
  // 检查URL参数，允许手动切换夜晚模式
  const urlParams = new URLSearchParams(window.location.search);
  const forceNight = urlParams.get('night') === 'true';
  
  return isNightByTime || forceNight;
};

// 获取天气数据
const fetchWeatherData = async (lat: number, lon: number): Promise<WeatherData> => {
  try {
    // 使用 wttr.in 服务，这是一个免费的天气服务
    const response = await fetch(`https://wttr.in/${lat},${lon}?format=j1`);
    
    if (!response.ok) {
      throw new Error('天气API请求失败');
    }

    const data = await response.json();
    return await parseWeatherData(data);
  } catch (error) {
    console.error('天气API调用失败:', error);
    throw error;
  }
};

// 天气描述中英文对照
const weatherTranslations: { [key: string]: string } = {
  'Sunny': '晴天',
  'Clear': '晴朗',
  'Partly cloudy': '多云',
  'Cloudy': '阴天',
  'Overcast': '阴霾',
  'Light rain': '小雨',
  'Moderate rain': '中雨',
  'Heavy rain': '大雨',
  'Light snow': '小雪',
  'Heavy snow': '大雪',
  'Thunderstorm': '雷雨',
  'Light rain shower': '阵雨',
  'Moderate rain shower': '中阵雨',
  'Heavy rain shower': '大阵雨',
  'Mist': '薄雾',
  'Fog': '雾',
  'Freezing rain': '冻雨',
  'Sleet': '雨夹雪',
  'Drizzle': '毛毛雨',
  'Light drizzle': '轻雾雨',
  'Heavy drizzle': '浓雾雨'
};

// 地名中英文对照（常用地名缓存）
const locationTranslations: { [key: string]: string } = {
  // 中国城市
  'Beijing': '北京',
  'Shanghai': '上海',
  'Guangzhou': '广州',
  'Shenzhen': '深圳',
  'Hangzhou': '杭州',
  'Nanjing': '南京',
  'Wuhan': '武汉',
  'Chengdu': '成都',
  'Chongqing': '重庆',
  'Tianjin': '天津',
  
  // 美国城市
  // 'Spring Valley': '春谷',
  'New York': '纽约',
  'Los Angeles': '洛杉矶',
  'Chicago': '芝加哥',
  'Houston': '休斯顿',
  'San Francisco': '旧金山',
  'Seattle': '西雅图',
  'Boston': '波士顿',
  'Washington': '华盛顿',
  'Miami': '迈阿密',
  'Las Vegas': '拉斯维加斯',
  
  // 其他国际城市
  'Tokyo': '东京',
  'London': '伦敦',
  'Paris': '巴黎',
  'Seoul': '首尔',
  'Sydney': '悉尼',
  'Toronto': '多伦多',
  
  // 国家名称
  'China': '中国',
  'United States': '美国',
  'United States of America': '美国',
  'United Kingdom': '英国',
  'Japan': '日本',
  'South Korea': '韩国',
  'Singapore': '新加坡',
  'Australia': '澳大利亚',
  'Canada': '加拿大',
  'France': '法国',
  'Germany': '德国'
};

// 缓存翻译结果，避免重复API调用
const translationCache: { [key: string]: { result: string; timestamp: number } } = {};
const TRANSLATION_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24小时缓存

// 翻译服务配置
const TRANSLATION_SERVICES = [
  {
    name: 'MyMemory',
    url: (text: string) => `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|zh`,
    parser: (data: any) => data.responseStatus === 200 && data.responseData?.translatedText ? data.responseData.translatedText : null
  },
  {
    name: 'LibreTranslate',
    url: (text: string) => `https://libretranslate.de/translate`,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: (text: string) => JSON.stringify({
      q: text,
      source: 'en',
      target: 'zh',
      format: 'text'
    }),
    parser: (data: any) => data.translatedText || null
  },
  {
    name: 'Google Translate (Free)',
    url: (text: string) => `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=zh&dt=t&q=${encodeURIComponent(text)}`,
    parser: (data: any) => {
      if (Array.isArray(data) && data[0] && Array.isArray(data[0]) && data[0][0] && data[0][0][0]) {
        return data[0][0][0];
      }
      return null;
    }
  }
];

// 使用多个翻译服务API自动翻译地名
const translateLocationName = async (locationName: string): Promise<string> => {
  // 先检查本地缓存
  if (locationTranslations[locationName]) {
    return locationTranslations[locationName];
  }
  
  // 检查运行时缓存
  const cached = translationCache[locationName];
  if (cached && (Date.now() - cached.timestamp) < TRANSLATION_CACHE_DURATION) {
    return cached.result;
  }
  
  // 尝试使用多个翻译服务
  for (const service of TRANSLATION_SERVICES) {
    try {
      const requestOptions: RequestInit = {
        method: service.method || 'GET',
        ...(service.headers && { headers: service.headers }),
        ...(service.body && { body: service.body(locationName) })
      };
      
      const response = await fetch(service.url(locationName), requestOptions);
      
      if (response.ok) {
        const data = await response.json();
        const translated = service.parser(data);
        
        if (translated && translated !== locationName) {
          // 清理翻译结果
          const cleanTranslated = cleanTranslationResult(translated);
          
          // 缓存翻译结果
          translationCache[locationName] = { result: cleanTranslated, timestamp: Date.now() };
          return cleanTranslated;
        }
      }
    } catch (error) {
      // 静默处理翻译失败，继续尝试下一个服务
      continue;
    }
  }
  
  // 如果所有翻译服务都失败，使用备用处理
  return processLocationNameFallback(locationName);
};

// 清理翻译结果
const cleanTranslationResult = (translated: string): string => {
  return translated
    .trim()
    .replace(/^["']|["']$/g, '') // 移除首尾引号
    .replace(/\s+/g, ' ') // 规范化空格
    .substring(0, 50); // 限制长度
};

// 备用地名处理逻辑
const processLocationNameFallback = (locationName: string): string => {
  // 移除常见的英文后缀
  const cleanName = locationName
    .replace(/ County$/, '县')
    .replace(/ City$/, '市')
    .replace(/ State$/, '州')
    .replace(/ Province$/, '省')
    .replace(/ District$/, '区')
    .replace(/ Region$/, '地区');
    
  // 如果处理后还是英文，保持原样
  return cleanName;
};

// 自动翻译天气描述
const translateWeatherDescription = async (description: string): Promise<string> => {
  // 先检查本地翻译表
  if (weatherTranslations[description]) {
    return weatherTranslations[description];
  }
  
  // 检查缓存
  const cached = translationCache[`weather_${description}`];
  if (cached && (Date.now() - cached.timestamp) < TRANSLATION_CACHE_DURATION) {
    return cached.result;
  }
  
  // 尝试API翻译
  for (const service of TRANSLATION_SERVICES) {
    try {
      const requestOptions: RequestInit = {
        method: service.method || 'GET',
        ...(service.headers && { headers: service.headers }),
        ...(service.body && { body: service.body(description) })
      };
      
      const response = await fetch(service.url(description), requestOptions);
      
      if (response.ok) {
        const data = await response.json();
        const translated = service.parser(data);
        
        if (translated && translated !== description) {
          const cleanTranslated = cleanTranslationResult(translated);
          
          // 缓存翻译结果
          translationCache[`weather_${description}`] = { result: cleanTranslated, timestamp: Date.now() };
          return cleanTranslated;
        }
      }
    } catch (error) {
      console.warn(`天气描述翻译失败 (${service.name}):`, error);
      continue;
    }
  }
  
  // 如果翻译失败，返回原文
  return description;
};

// 解析天气数据
const parseWeatherData = async (data: any): Promise<WeatherData> => {
  const current = data.current_condition[0];
  const location = data.nearest_area[0];
  const now = new Date();
  const isNight = isNightTime(now);
  const moonPhase = calculateMoonPhase(now);
  
  const weatherConditions = {
    'Sunny': { condition: isNight ? 'night' : 'sunny', icon: isNight ? MOON_PHASE_ICONS[moonPhase] : '☀️' },
    'Clear': { condition: isNight ? 'night' : 'clear', icon: isNight ? MOON_PHASE_ICONS[moonPhase] : '🌙' },
    'Partly cloudy': { condition: isNight ? 'night' : 'cloudy', icon: isNight ? '☁️' : '⛅' },
    'Cloudy': { condition: isNight ? 'night' : 'cloudy', icon: '☁️' },
    'Overcast': { condition: isNight ? 'night' : 'cloudy', icon: '☁️' },
    'Light rain': { condition: isNight ? 'night' : 'rainy', icon: '🌧️' },
    'Moderate rain': { condition: isNight ? 'night' : 'rainy', icon: '🌧️' },
    'Heavy rain': { condition: isNight ? 'night' : 'rainy', icon: '⛈️' },
    'Thunderstorm': { condition: isNight ? 'night' : 'rainy', icon: '⛈️' },
    'Light snow': { condition: isNight ? 'night' : 'snowy', icon: '🌨️' },
    'Heavy snow': { condition: isNight ? 'night' : 'snowy', icon: '❄️' }
  };

  const weatherDesc = current.weatherDesc[0].value;
  
  const weatherInfo = weatherConditions[weatherDesc as keyof typeof weatherConditions] || { 
    condition: isNight ? 'night' : 'cloudy', 
    icon: isNight ? MOON_PHASE_ICONS[moonPhase] : '🌤️' 
  };

  // 自动翻译地名
  const areaName = location.areaName[0].value;
  const countryName = location.country[0].value;
  
  try {
    const translatedArea = await translateLocationName(areaName);
    const translatedCountry = await translateLocationName(countryName);
    
    // 翻译天气描述
    const translatedWeatherDesc = await translateWeatherDescription(weatherDesc);

    return {
      location: `${translatedArea}, ${translatedCountry}`,
      description: isNight ? `夜晚 - ${translatedWeatherDesc}` : translatedWeatherDesc,
      temperature: current.temp_C,
      condition: weatherInfo.condition as WeatherData['condition'],
      icon: weatherInfo.icon,
      humidity: current.humidity,
      windSpeed: current.windspeedKmph,
      moonPhase: moonPhase  // 始终提供月相信息，不再设为 undefined
    };
  } catch (error) {
    console.warn('地名翻译失败，使用备用方案:', error);
    // 翻译失败时使用原有逻辑
    const translatedArea = locationTranslations[areaName] || areaName;
    const translatedCountry = locationTranslations[countryName] || countryName;
    const translatedWeatherDesc = await translateWeatherDescription(weatherDesc);

    return {
      location: `${translatedArea}, ${translatedCountry}`,
      description: isNight ? `夜晚 - ${translatedWeatherDesc}` : translatedWeatherDesc,
      temperature: current.temp_C,
      condition: weatherInfo.condition as WeatherData['condition'],
      icon: weatherInfo.icon,
      humidity: current.humidity,
      windSpeed: current.windspeedKmph,
      moonPhase: moonPhase  // 始终提供月相信息，不再设为 undefined
    };
  }
};

// 获取模拟天气数据
const getMockWeatherData = (): WeatherData => {
  const now = new Date();
  const isNight = isNightTime(now);
  const moonPhase = calculateMoonPhase(now);
  
  const mockWeatherData = [
    { 
      location: '北京市', 
      description: isNight ? '夜晚 - 晴天' : '晴天', 
      temperature: '22', 
      condition: isNight ? 'night' as const : 'sunny' as const, 
      icon: isNight ? MOON_PHASE_ICONS[moonPhase] : '☀️',
      moonPhase: moonPhase  // 始终提供月相信息
    },
    { 
      location: '上海市', 
      description: isNight ? '夜晚 - 多云' : '多云', 
      temperature: '18', 
      condition: isNight ? 'night' as const : 'cloudy' as const, 
      icon: '☁️',
      moonPhase: moonPhase  // 始终提供月相信息
    },
    { 
      location: '广州市', 
      description: isNight ? '夜晚 - 小雨' : '小雨', 
      temperature: '25', 
      condition: isNight ? 'night' as const : 'rainy' as const, 
      icon: '🌧️',
      moonPhase: moonPhase  // 始终提供月相信息
    },
    { 
      location: '成都市', 
      description: isNight ? '夜晚 - 阴天' : '阴天', 
      temperature: '16', 
      condition: isNight ? 'night' as const : 'cloudy' as const, 
      icon: '⛅',
      moonPhase: moonPhase  // 始终提供月相信息
    }
  ];

  return mockWeatherData[Math.floor(Math.random() * mockWeatherData.length)];
};

// 天气数据缓存
let weatherCache: {
  data: WeatherData | null;
  timestamp: number;
  location: string;
} = {
  data: null,
  timestamp: 0,
  location: ''
};

const CACHE_DURATION = 30 * 60 * 1000; // 30分钟缓存，减少API调用频率

// 主函数：获取天气数据
export const getWeatherData = async (): Promise<WeatherData> => {
  try {
    // 获取用户位置
    const position = await getCurrentPosition();
    const { latitude, longitude } = position.coords;
    const locationKey = `${latitude.toFixed(2)},${longitude.toFixed(2)}`;
    
    // 检查缓存
    const now = Date.now();
    if (
      weatherCache.data && 
      weatherCache.location === locationKey &&
      (now - weatherCache.timestamp) < CACHE_DURATION
    ) {
      return weatherCache.data;
    }
    // 获取天气数据
    const weatherData = await fetchWeatherData(latitude, longitude);
    
    // 更新缓存
    weatherCache = {
      data: weatherData,
      timestamp: now,
      location: locationKey
    };
    
    return weatherData;

  } catch (error) {
    console.error('获取天气失败:', error);
    // 如果有缓存数据，即使过期也使用
    if (weatherCache.data) {
      return weatherCache.data;
    }
    // 使用模拟数据作为fallback
    return getMockWeatherData();
  }
}; 
import { WeatherData, MOON_PHASE_ICONS } from '../types';
import { calculateMoonPhase } from './moonPhaseService';
import { API_CONFIG, validateApiConfig, getApiInfo } from '../config/apiConfig';

// 天气状态表情符号映射
const WEATHER_EMOJI_MAP: { [key: string]: string } = {
  // 晴天相关
  '晴': '☀️', '晴天': '☀️', '晴朗': '☀️', '晴间多云': '⛅',
  'Sunny': '☀️', 'Clear': '☀️',
  
  // 云相关
  '多云': '☁️', '少云': '⛅', '阴': '☁️', '阴天': '☁️', '阴霾': '☁️',
  '局部多云': '⛅',
  'Partly cloudy': '⛅', 'Cloudy': '☁️', 'Overcast': '☁️',
  
  // 雨相关
  '雨': '🌧️', '小雨': '🌦️', '中雨': '🌧️', '大雨': '🌧️', '暴雨': '⛈️',
  '阵雨': '🌦️', '雷雨': '⛈️', '雷阵雨': '⛈️', '毛毛雨': '🌦️',
  '大暴雨': '⛈️', '特大暴雨': '⛈️', '极大雨': '⛈️', '冻雨': '🧊',
  'Light rain': '🌦️', 'Moderate rain': '🌧️', 'Heavy rain': '🌧️',
  'Thunderstorm': '⛈️', 'Drizzle': '🌦️',
  
  // 雪相关
  '雪': '❄️', '小雪': '🌨️', '中雪': '❄️', '大雪': '❄️', '暴雪': '❄️',
  '阵雪': '🌨️', '冰雹': '🧊',
  'Light snow': '🌨️', 'Heavy snow': '❄️', 'Sleet': '🌨️',
  
  // 雨雪混合
  '雨夹雪': '🌧️❄️', '雨雪天气': '🌧️❄️', '阵雨夹雪': '🌦️❄️',
  
  // 雾霾相关
  '雾': '🌫️', '薄雾': '🌫️', '浓雾': '🌫️', '霾': '🌫️', '大雾': '🌫️',
  'Fog': '🌫️', 'Mist': '🌫️',
  
  // 风相关
  '大风': '💨', '强风': '💨', '狂风': '💨', '龙卷风': '🌪️', '台风': '🌪️',
  '沙尘暴': '🌪️', '扬沙': '🌪️',
  
  // 其他
  '热': '🔥', '冷': '🥶', '未知': '❓'
};

// 将天气描述转换为表情符号
const convertWeatherToEmoji = (description: string): string => {
  if (!description) return '❓';
  
  // 移除夜晚前缀进行匹配
  let cleanDesc = description.replace(/^夜晚\s*-\s*/, '');
  
  // 处理复合天气（包含多种天气现象）
  const weatherWords = cleanDesc.split(/[与和及、，,\s]+/).filter(word => word.length > 0);
  
  // 检查是否为复合天气
  if (weatherWords.length > 1) {
    const emojis: string[] = [];
    
    for (const word of weatherWords) {
      // 查找匹配的表情符号
      for (const [key, emoji] of Object.entries(WEATHER_EMOJI_MAP)) {
        if (word.includes(key) || key.includes(word)) {
          if (!emojis.includes(emoji)) {
            emojis.push(emoji);
          }
          break;
        }
      }
    }
    
    if (emojis.length > 0) {
      return emojis.join('');
    }
  }
  
  // 单一天气或直接匹配
  for (const [key, emoji] of Object.entries(WEATHER_EMOJI_MAP)) {
    if (cleanDesc.includes(key) || key.includes(cleanDesc)) {
      return emoji;
    }
  }
  
  // 特殊处理一些常见的复合天气
  if (cleanDesc.includes('雨') && cleanDesc.includes('雪')) {
    return '🌧️❄️';
  }
  if (cleanDesc.includes('雷') && cleanDesc.includes('雨')) {
    return '⛈️';
  }
  if (cleanDesc.includes('风') && cleanDesc.includes('雨')) {
    return '🌧️💨';
  }
  if (cleanDesc.includes('风') && cleanDesc.includes('雪')) {
    return '❄️💨';
  }
  
  // 如果都没匹配到，返回默认表情
  return '🌤️';
};

// 导出天气表情符号转换函数
export { convertWeatherToEmoji };

// 天气API配置（从配置文件导入）
const WEATHER_APIS = {
  qweather: API_CONFIG.qweather,
  amap: API_CONFIG.amap,
  wttr: API_CONFIG.wttr
};

// 检查并报告API配置状态
const checkApiConfiguration = () => {
  const apiInfo = getApiInfo();
  const validation = validateApiConfig();
  
  console.log('🌤️ 天气API配置状态:');
  console.log('- 高德地图:', apiInfo.amap.configured ? '✅ 已配置（国内优先）' : '⚠️ 未配置（推荐配置）');
  console.log('- 和风天气:', apiInfo.qweather.configured ? '✅ 已配置（备用）' : '❌ 未配置');
  console.log('- wttr.in:', '✅ 无需配置（国外优先，可能有CORS问题）');
  console.log('🎯 API选择策略: 国内用户（高德→和风→wttr）| 国外用户（wttr→和风）');
  
  if (!validation.isValid) {
    console.warn('⚠️ API配置问题:', validation.issues.join(', '));
    console.log('📖 配置指南: 请在 src/config/apiConfig.ts 中配置你的API密钥');
  }
  
  if (validation.warnings && validation.warnings.length > 0) {
    console.warn('💡 建议:', validation.warnings.join(', '));
  }
  
  return validation;
};

// 创建优化的请求函数，支持超时和重试
const createOptimizedFetch = (timeout: number = 10000) => {
  return async (url: string, options: RequestInit = {}): Promise<Response> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  };
};

// API调用缓存和防重复调用机制
interface AmapCacheData {
  time: number;
  lat: number;
  lon: number;
  data: WeatherData;
}

let lastAmapCall: AmapCacheData | null = null;
const API_CACHE_DURATION = 10 * 60 * 1000; // 10分钟缓存
let amapCallInProgress = false;

// 检查坐标是否在中国境内（包括港澳台）
const isLocationInChina = (lat: number, lon: number): boolean => {
  // 中国大陆、香港、澳门、台湾的大致坐标范围
  // 纬度：18°N - 54°N，经度：73°E - 135°E
  if (lat >= 18 && lat <= 54 && lon >= 73 && lon <= 135) {
    return true;
  }
  return false;
};

// 检查坐标是否在和风天气支持的地区
const isQWeatherSupportedRegion = (lat: number, lon: number): boolean => {
  // 和风天气主要覆盖中国大陆、香港、澳门、台湾以及部分亚洲地区
  // 扩展到整个亚洲地区以提供更好的覆盖
  if (lat >= 10 && lat <= 60 && lon >= 70 && lon <= 140) {
    return true;
  }
  return false;
};

// 和风天气API调用
const fetchQWeatherData = async (lat: number, lon: number): Promise<WeatherData> => {
  // 检查地区支持
  if (!isQWeatherSupportedRegion(lat, lon)) {
    console.log(`🌍 位置 (${lat.toFixed(2)}, ${lon.toFixed(2)}) 超出和风天气覆盖范围，跳过和风天气API`);
    throw new Error('位置超出和风天气覆盖范围');
  }
  
  const optimizedFetch = createOptimizedFetch(WEATHER_APIS.qweather.timeout);
  
  try {
    console.log(`🌤️ 调用和风天气API: 纬度=${lat}, 经度=${lon}`);
    
    // 获取实时天气
    const weatherUrl = `${WEATHER_APIS.qweather.baseUrl}/weather/now?location=${lon},${lat}&key=${WEATHER_APIS.qweather.key}`;
    const weatherResponse = await optimizedFetch(weatherUrl);
    
    if (!weatherResponse.ok) {
      // 获取详细错误信息
      let errorDetail = '';
      try {
        const errorData = await weatherResponse.json();
        errorDetail = ` - ${errorData.code}: ${errorData.refer || errorData.message || '未知错误'}`;
      } catch {
        errorDetail = ` - 无法解析错误详情`;
      }
      
      console.error(`和风天气API详细错误:`, {
        status: weatherResponse.status,
        statusText: weatherResponse.statusText,
        url: weatherUrl,
        detail: errorDetail
      });
      
      throw new Error(`和风天气API请求失败: ${weatherResponse.status}${errorDetail}`);
    }

    const weatherData = await weatherResponse.json();
    
    if (weatherData.code !== '200') {
      throw new Error(`和风天气API返回错误: ${weatherData.code}`);
    }

    // 获取城市信息
    const geoUrl = `${WEATHER_APIS.qweather.baseUrl}/city/lookup?location=${lon},${lat}&key=${WEATHER_APIS.qweather.key}`;
    const geoResponse = await optimizedFetch(geoUrl);
    
    let locationName = '未知位置';
    if (geoResponse.ok) {
      const geoData = await geoResponse.json();
      if (geoData.code === '200' && geoData.location && geoData.location.length > 0) {
        const location = geoData.location[0];
        locationName = formatLocationName(location.name, location.adm1, location.country);
      }
    }

    return parseQWeatherData(weatherData.now, locationName);
  } catch (error) {
    console.error('和风天气API调用失败:', error);
    throw error;
  }
};

// 解析和风天气数据
const parseQWeatherData = (data: any, location: string): WeatherData => {
  const now = new Date();
  const isNight = isNightTime(now);
  const moonPhase = calculateMoonPhase(now);
  
  // 和风天气图标代码映射
  const qweatherIconMap: { [key: string]: { condition: WeatherData['condition'], icon: string } } = {
    '100': { condition: isNight ? 'night' : 'sunny', icon: isNight ? MOON_PHASE_ICONS[moonPhase] : '☀️' }, // 晴
    '101': { condition: isNight ? 'night' : 'cloudy', icon: isNight ? '☁️' : '⛅' }, // 多云
    '102': { condition: isNight ? 'night' : 'cloudy', icon: '☁️' }, // 少云
    '103': { condition: isNight ? 'night' : 'cloudy', icon: '☁️' }, // 晴间多云
    '104': { condition: isNight ? 'night' : 'cloudy', icon: '☁️' }, // 阴
    '300': { condition: isNight ? 'night' : 'rainy', icon: '🌦️' }, // 阵雨
    '301': { condition: isNight ? 'night' : 'rainy', icon: '🌧️' }, // 强阵雨
    '302': { condition: isNight ? 'night' : 'rainy', icon: '⛈️' }, // 雷阵雨
    '303': { condition: isNight ? 'night' : 'rainy', icon: '⛈️' }, // 强雷阵雨
    '304': { condition: isNight ? 'night' : 'rainy', icon: '⛈️' }, // 雷阵雨伴有冰雹
    '305': { condition: isNight ? 'night' : 'rainy', icon: '🌧️' }, // 小雨
    '306': { condition: isNight ? 'night' : 'rainy', icon: '🌧️' }, // 中雨
    '307': { condition: isNight ? 'night' : 'rainy', icon: '🌧️' }, // 大雨
    '308': { condition: isNight ? 'night' : 'rainy', icon: '🌧️' }, // 极大雨
    '309': { condition: isNight ? 'night' : 'rainy', icon: '🌧️' }, // 毛毛雨
    '310': { condition: isNight ? 'night' : 'rainy', icon: '🌧️' }, // 暴雨
    '311': { condition: isNight ? 'night' : 'rainy', icon: '🌧️' }, // 大暴雨
    '312': { condition: isNight ? 'night' : 'rainy', icon: '🌧️' }, // 特大暴雨
    '313': { condition: isNight ? 'night' : 'rainy', icon: '🌧️' }, // 冻雨
    '400': { condition: isNight ? 'night' : 'snowy', icon: '🌨️' }, // 小雪
    '401': { condition: isNight ? 'night' : 'snowy', icon: '🌨️' }, // 中雪
    '402': { condition: isNight ? 'night' : 'snowy', icon: '❄️' }, // 大雪
    '403': { condition: isNight ? 'night' : 'snowy', icon: '❄️' }, // 暴雪
    '404': { condition: isNight ? 'night' : 'snowy', icon: '🌨️' }, // 雨夹雪
    '405': { condition: isNight ? 'night' : 'snowy', icon: '🌨️' }, // 雨雪天气
    '406': { condition: isNight ? 'night' : 'snowy', icon: '🌨️' }, // 阵雨夹雪
    '407': { condition: isNight ? 'night' : 'snowy', icon: '🌨️' }, // 阵雪
    '500': { condition: isNight ? 'night' : 'cloudy', icon: '🌫️' }, // 薄雾
    '501': { condition: isNight ? 'night' : 'cloudy', icon: '🌫️' }, // 雾
    '502': { condition: isNight ? 'night' : 'cloudy', icon: '🌫️' }, // 霾
    '503': { condition: isNight ? 'night' : 'cloudy', icon: '💨' }, // 扬沙
    '504': { condition: isNight ? 'night' : 'cloudy', icon: '💨' }, // 浮尘
    '507': { condition: isNight ? 'night' : 'cloudy', icon: '💨' }, // 沙尘暴
    '508': { condition: isNight ? 'night' : 'cloudy', icon: '💨' }, // 强沙尘暴
  };

  const iconCode = data.icon || '100';
  const weatherInfo = qweatherIconMap[iconCode] || { 
    condition: isNight ? 'night' : 'cloudy', 
    icon: isNight ? MOON_PHASE_ICONS[moonPhase] : '🌤️' 
  };

  // 根据天气代码生成中文描述
  const getWeatherDescription = (iconCode: string): string => {
    const descriptions: { [key: string]: string } = {
      '100': '晴天', '101': '多云', '102': '少云', '103': '晴间多云', '104': '阴天',
      '300': '阵雨', '301': '强阵雨', '302': '雷阵雨', '303': '强雷阵雨', '304': '雷阵雨伴有冰雹',
      '305': '小雨', '306': '中雨', '307': '大雨', '308': '极大雨', '309': '毛毛雨',
      '310': '暴雨', '311': '大暴雨', '312': '特大暴雨', '313': '冻雨',
      '400': '小雪', '401': '中雪', '402': '大雪', '403': '暴雪', '404': '雨夹雪',
      '405': '雨雪天气', '406': '阵雨夹雪', '407': '阵雪',
      '500': '薄雾', '501': '雾', '502': '霾', '503': '扬沙', '504': '浮尘',
      '507': '沙尘暴', '508': '强沙尘暴'
    };
    return descriptions[iconCode] || data.text || '未知天气';
  };

  const description = getWeatherDescription(iconCode);

  return {
    location: location,
    description: isNight ? `夜晚 - ${description}` : description,
    temperature: data.temp || '0',
    condition: weatherInfo.condition,
    icon: weatherInfo.icon,
    humidity: data.humidity || '0',
    windSpeed: data.windSpeed || '0',
    moonPhase: moonPhase
  };
};

// 高德地图天气API调用
const fetchAmapWeatherData = async (lat: number, lon: number): Promise<WeatherData> => {
  const optimizedFetch = createOptimizedFetch(WEATHER_APIS.amap.timeout);
  
  try {
    if (!WEATHER_APIS.amap.key) {
      throw new Error('高德地图API密钥未配置');
    }

    // 检查坐标范围，高德地图主要服务中国地区
    if (lat < 18 || lat > 54 || lon < 73 || lon > 135) {
      throw new Error(`坐标超出高德地图服务范围: 纬度=${lat}, 经度=${lon}`);
    }

    // 检查缓存
    const now = Date.now();
    if (lastAmapCall && 
        now - lastAmapCall.time < API_CACHE_DURATION &&
        Math.abs(lastAmapCall.lat - lat) < 0.01 &&
        Math.abs(lastAmapCall.lon - lon) < 0.01) {
      console.log('🎯 使用高德地图API缓存数据');
      return lastAmapCall.data;
    }

    // 防止重复调用
    if (amapCallInProgress) {
      throw new Error('高德地图API调用正在进行中，请稍后重试');
    }

    amapCallInProgress = true;

    console.log(`🗺️ 调用高德地图天气API: 纬度=${lat}, 经度=${lon}`);
    
    // 首先获取城市编码 - 格式：经度,纬度，保留6位小数
    const location = `${lon.toFixed(6)},${lat.toFixed(6)}`;
    const geoUrl = `${WEATHER_APIS.amap.baseUrl}/geocode/regeo?location=${location}&key=${WEATHER_APIS.amap.key}&output=json&radius=1000&extensions=base`;
    const geoResponse = await optimizedFetch(geoUrl);
    
    if (!geoResponse.ok) {
      throw new Error(`高德地图地理编码API请求失败: ${geoResponse.status}`);
    }

    const geoData = await geoResponse.json();
    if (geoData.status !== '1' || !geoData.regeocode) {
      throw new Error(`地理编码失败: ${geoData.info || '未知错误'}`);
    }

    const cityCode = geoData.regeocode.addressComponent.adcode;
    if (!cityCode) {
      throw new Error('无法获取城市编码');
    }

    const locationName = formatLocationName(
      geoData.regeocode.addressComponent.city || geoData.regeocode.addressComponent.district,
      geoData.regeocode.addressComponent.province
    );

    // 获取天气信息 - 添加extensions参数获取实时天气
    const weatherUrl = `${WEATHER_APIS.amap.baseUrl}/weather/weatherInfo?city=${cityCode}&key=${WEATHER_APIS.amap.key}&extensions=base&output=json`;
    const weatherResponse = await optimizedFetch(weatherUrl);
    
    if (!weatherResponse.ok) {
      throw new Error(`高德地图天气API请求失败: ${weatherResponse.status}`);
    }

    const weatherData = await weatherResponse.json();
    if (weatherData.status !== '1' || !weatherData.lives || weatherData.lives.length === 0) {
      throw new Error(`天气数据获取失败: ${weatherData.info || '未知错误'}`);
    }

    console.log('🌤️ 高德地图API调用成功');
    const result = await parseAmapWeatherData(weatherData.lives[0], locationName);
    
    // 缓存成功的结果
    lastAmapCall = {
      time: now,
      lat,
      lon,
      data: result
    };
    
    return result;
  } catch (error) {
    console.error('高德地图天气API调用失败:', error);
    throw error;
  } finally {
    amapCallInProgress = false;
  }
};

// 解析高德地图天气数据
const parseAmapWeatherData = async (data: any, location: string): Promise<WeatherData> => {
  const now = new Date();
  const isNight = isNightTime(now);
  const moonPhase = calculateMoonPhase(now);
  
  // 高德天气状况映射
  const weatherConditions: { [key: string]: { condition: WeatherData['condition']; icon: string } } = {
    '晴': { condition: isNight ? 'night' : 'sunny', icon: isNight ? MOON_PHASE_ICONS[moonPhase] : '☀️' },
    '少云': { condition: isNight ? 'night' : 'cloudy', icon: isNight ? '☁️' : '⛅' },
    '晴间多云': { condition: isNight ? 'night' : 'cloudy', icon: isNight ? '☁️' : '⛅' },
    '多云': { condition: isNight ? 'night' : 'cloudy', icon: '☁️' },
    '阴': { condition: isNight ? 'night' : 'cloudy', icon: '☁️' },
    '有风': { condition: isNight ? 'night' : 'cloudy', icon: '🌬️' },
    '平静': { condition: isNight ? 'night' : 'sunny', icon: isNight ? MOON_PHASE_ICONS[moonPhase] : '☀️' },
    '微风': { condition: isNight ? 'night' : 'cloudy', icon: '🌬️' },
    '和风': { condition: isNight ? 'night' : 'cloudy', icon: '🌬️' },
    '清风': { condition: isNight ? 'night' : 'cloudy', icon: '🌬️' },
    '强风/劲风': { condition: isNight ? 'night' : 'cloudy', icon: '💨' },
    '疾风': { condition: isNight ? 'night' : 'cloudy', icon: '💨' },
    '大风': { condition: isNight ? 'night' : 'cloudy', icon: '💨' },
    '烈风': { condition: isNight ? 'night' : 'cloudy', icon: '💨' },
    '风暴': { condition: isNight ? 'night' : 'rainy', icon: '⛈️' },
    '狂爆风': { condition: isNight ? 'night' : 'rainy', icon: '⛈️' },
    '飓风': { condition: isNight ? 'night' : 'rainy', icon: '🌪️' },
    '热带风暴': { condition: isNight ? 'night' : 'rainy', icon: '🌪️' },
    '霾': { condition: isNight ? 'night' : 'cloudy', icon: '🌫️' },
    '中度霾': { condition: isNight ? 'night' : 'cloudy', icon: '🌫️' },
    '重度霾': { condition: isNight ? 'night' : 'cloudy', icon: '🌫️' },
    '严重霾': { condition: isNight ? 'night' : 'cloudy', icon: '🌫️' },
    '雾': { condition: isNight ? 'night' : 'cloudy', icon: '🌫️' },
    '浓雾': { condition: isNight ? 'night' : 'cloudy', icon: '🌫️' },
    '强浓雾': { condition: isNight ? 'night' : 'cloudy', icon: '🌫️' },
    '轻雾': { condition: isNight ? 'night' : 'cloudy', icon: '🌫️' },
    '大雾': { condition: isNight ? 'night' : 'cloudy', icon: '🌫️' },
    '特强浓雾': { condition: isNight ? 'night' : 'cloudy', icon: '🌫️' },
    '阵雨': { condition: isNight ? 'night' : 'rainy', icon: '🌧️' },
    '雷阵雨': { condition: isNight ? 'night' : 'rainy', icon: '⛈️' },
    '雷阵雨并伴有冰雹': { condition: isNight ? 'night' : 'rainy', icon: '⛈️' },
    '小雨': { condition: isNight ? 'night' : 'rainy', icon: '🌧️' },
    '中雨': { condition: isNight ? 'night' : 'rainy', icon: '🌧️' },
    '大雨': { condition: isNight ? 'night' : 'rainy', icon: '🌧️' },
    '暴雨': { condition: isNight ? 'night' : 'rainy', icon: '⛈️' },
    '大暴雨': { condition: isNight ? 'night' : 'rainy', icon: '⛈️' },
    '特大暴雨': { condition: isNight ? 'night' : 'rainy', icon: '⛈️' },
    '强阵雨': { condition: isNight ? 'night' : 'rainy', icon: '⛈️' },
    '强雷阵雨': { condition: isNight ? 'night' : 'rainy', icon: '⛈️' },
    '极端降雨': { condition: isNight ? 'night' : 'rainy', icon: '⛈️' },
    '毛毛雨/细雨': { condition: isNight ? 'night' : 'rainy', icon: '🌦️' },
    '雨': { condition: isNight ? 'night' : 'rainy', icon: '🌧️' },
    '小雨-中雨': { condition: isNight ? 'night' : 'rainy', icon: '🌧️' },
    '中雨-大雨': { condition: isNight ? 'night' : 'rainy', icon: '🌧️' },
    '大雨-暴雨': { condition: isNight ? 'night' : 'rainy', icon: '⛈️' },
    '暴雨-大暴雨': { condition: isNight ? 'night' : 'rainy', icon: '⛈️' },
    '大暴雨-特大暴雨': { condition: isNight ? 'night' : 'rainy', icon: '⛈️' },
    '雨雪天气': { condition: isNight ? 'night' : 'snowy', icon: '🌨️' },
    '雨夹雪': { condition: isNight ? 'night' : 'snowy', icon: '🌨️' },
    '阵雨夹雪': { condition: isNight ? 'night' : 'snowy', icon: '🌨️' },
    '冻雨': { condition: isNight ? 'night' : 'snowy', icon: '🧊' },
    '雪': { condition: isNight ? 'night' : 'snowy', icon: '❄️' },
    '阵雪': { condition: isNight ? 'night' : 'snowy', icon: '🌨️' },
    '小雪': { condition: isNight ? 'night' : 'snowy', icon: '🌨️' },
    '中雪': { condition: isNight ? 'night' : 'snowy', icon: '❄️' },
    '大雪': { condition: isNight ? 'night' : 'snowy', icon: '❄️' },
    '暴雪': { condition: isNight ? 'night' : 'snowy', icon: '❄️' },
    '小雪-中雪': { condition: isNight ? 'night' : 'snowy', icon: '🌨️' },
    '中雪-大雪': { condition: isNight ? 'night' : 'snowy', icon: '❄️' },
    '大雪-暴雪': { condition: isNight ? 'night' : 'snowy', icon: '❄️' },
    '浮尘': { condition: isNight ? 'night' : 'cloudy', icon: '🌫️' },
    '扬沙': { condition: isNight ? 'night' : 'cloudy', icon: '🌫️' },
    '沙尘暴': { condition: isNight ? 'night' : 'cloudy', icon: '🌪️' },
    '强沙尘暴': { condition: isNight ? 'night' : 'cloudy', icon: '🌪️' },
    '龙卷风': { condition: isNight ? 'night' : 'rainy', icon: '🌪️' },
    '冰雹': { condition: isNight ? 'night' : 'rainy', icon: '🧊' },
    '热': { condition: isNight ? 'night' : 'sunny', icon: '🔥' },
    '冷': { condition: isNight ? 'night' : 'cloudy', icon: '🥶' },
    '未知': { condition: isNight ? 'night' : 'cloudy', icon: '❓' }
  };

  const weatherDesc = data.weather || '未知';
  const weatherInfo = weatherConditions[weatherDesc] || { 
    condition: isNight ? 'night' as const : 'cloudy' as const, 
    icon: isNight ? MOON_PHASE_ICONS[moonPhase] : '🌤️' 
  };

  return {
    location: location,
    description: isNight ? `夜晚 - ${weatherDesc}` : weatherDesc,
    temperature: data.temperature || '0',
    condition: weatherInfo.condition,
    icon: weatherInfo.icon,
    humidity: data.humidity || '0',
    windSpeed: data.winddirection && data.windpower ? `${data.winddirection}风${data.windpower}级` : '0',
    moonPhase: moonPhase
  };
};

// 获取当前位置（优化版本）
const getCurrentPosition = (): Promise<GeolocationPosition> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      console.warn('浏览器不支持地理位置，使用默认位置');
      // 返回北京的坐标作为默认位置
      resolve({
        coords: {
          latitude: 39.9042,
          longitude: 116.4074,
          accuracy: 0,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null
        },
        timestamp: Date.now()
      } as GeolocationPosition);
      return;
    }

    console.log('🌍 正在获取您的位置...');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log('✅ 位置获取成功:', position.coords.latitude, position.coords.longitude);
        resolve(position);
      },
      (error) => {
        console.warn('⚠️ 位置获取失败，使用默认位置（北京）:', error.message);
        console.log('💡 提示：可以手动允许位置访问以获得准确的本地天气');
        // 位置获取失败时，使用北京作为默认位置
        resolve({
          coords: {
            latitude: 39.9042,
            longitude: 116.4074,
            accuracy: 0,
            altitude: null,
            altitudeAccuracy: null,
            heading: null,
            speed: null
          },
          timestamp: Date.now()
        } as GeolocationPosition);
      },
      { 
        timeout: 15000, 
        enableHighAccuracy: false, // 改为false以加快获取速度
        maximumAge: 300000 // 5分钟内的缓存位置可用
      }
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

// 获取天气数据 (wttr.in - 备用API)
const fetchWeatherData = async (lat: number, lon: number): Promise<WeatherData> => {
  const optimizedFetch = createOptimizedFetch(WEATHER_APIS.wttr.timeout);
  
  // 开发环境直接使用代理，避免CORS问题
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  if (isDevelopment) {
    // 开发环境优先使用代理，避免CORS延迟
    try {
      console.log('💡 开发环境：直接使用代理端点避免CORS问题');
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://wttr.in/${lat},${lon}?format=j1`)}`;
      const proxyResponse = await optimizedFetch(proxyUrl);
      
      if (proxyResponse.ok) {
        const data = await proxyResponse.json();
        console.log('✅ 代理API调用成功');
        return await parseWeatherData(data);
      } else {
        throw new Error(`代理API调用失败: ${proxyResponse.status}`);
      }
    } catch (proxyError) {
      console.warn('代理API调用失败，尝试直接调用:', proxyError);
      // 代理失败时才尝试直接调用
    }
  }
  
  try {
    // 生产环境或代理失败时尝试直接调用
    console.log('🌐 尝试直接调用wttr.in API...');
    const apiUrl = `${WEATHER_APIS.wttr.baseUrl}/${lat},${lon}?format=j1&lang=zh`;
    
    const response = await optimizedFetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'WeatherDiary/1.0'
      },
      mode: 'cors', // 明确指定CORS模式
    });
    
    if (!response.ok) {
      throw new Error(`wttr.in API请求失败: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ 直接API调用成功');
    return await parseWeatherData(data);
  } catch (error) {
    console.error('直接API调用失败:', error);
    
    // 如果直接调用失败且不是开发环境，尝试代理
    if (!isDevelopment) {
      try {
        console.log('尝试使用代理端点...');
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://wttr.in/${lat},${lon}?format=j1`)}`;
        const proxyResponse = await optimizedFetch(proxyUrl);
        
        if (proxyResponse.ok) {
          const data = await proxyResponse.json();
          console.log('✅ 代理API调用成功');
          return await parseWeatherData(data);
        } else {
          throw new Error(`代理API调用失败: ${proxyResponse.status}`);
        }
      } catch (proxyError) {
        console.error('代理API调用也失败:', proxyError);
      }
    }
    
    throw error; // 抛出原始错误
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

// 地名中英文对照（精简版本，减少API调用和重复项）
const locationTranslations: { [key: string]: string } = {
  // === 中国城市 ===
  'Beijing': '北京', 'Shanghai': '上海', 'Guangzhou': '广州', 'Shenzhen': '深圳',
  'Hangzhou': '杭州', 'Nanjing': '南京', 'Wuhan': '武汉', 'Chengdu': '成都',
  'Chongqing': '重庆', 'Tianjin': '天津', 'Xian': '西安', 'Suzhou': '苏州',
  'Qingdao': '青岛', 'Dalian': '大连', 'Ningbo': '宁波', 'Xiamen': '厦门',
  'Kunming': '昆明', 'Changsha': '长沙', 'Taiyuan': '太原', 'Hefei': '合肥',
  'Nanchang': '南昌', 'Guiyang': '贵阳', 'Fuzhou': '福州', 'Harbin': '哈尔滨',
  'Jinan': '济南', 'Changchun': '长春', 'Shijiazhuang': '石家庄', 'Shenyang': '沈阳',
  'Zhengzhou': '郑州', 'Lanzhou': '兰州', 'Urumqi': '乌鲁木齐', 'Lhasa': '拉萨',
  'Hohhot': '呼和浩特', 'Yinchuan': '银川', 'Xining': '西宁', 'Haikou': '海口',
  'Nanning': '南宁',
  
  // === 美国主要城市 ===
  'New York': '纽约', 'Los Angeles': '洛杉矶', 'Chicago': '芝加哥', 'Houston': '休斯顿',
  'Phoenix': '凤凰城', 'Philadelphia': '费城', 'San Antonio': '圣安东尼奥', 'San Diego': '圣地亚哥',
  'Dallas': '达拉斯', 'San Jose': '圣何塞', 'Austin': '奥斯汀', 'Jacksonville': '杰克逊维尔',
  'San Francisco': '旧金山', 'Columbus': '哥伦布', 'Charlotte': '夏洛特', 'Fort Worth': '沃思堡',
  'Indianapolis': '印第安纳波利斯', 'Seattle': '西雅图', 'Denver': '丹佛', 'Boston': '波士顿',
  'Detroit': '底特律', 'Nashville': '纳什维尔', 'Portland': '波特兰', 'Memphis': '孟菲斯',
  'Las Vegas': '拉斯维加斯', 'Louisville': '路易维尔', 'Baltimore': '巴尔的摩', 'Milwaukee': '密尔沃基',
  'Atlanta': '亚特兰大', 'Miami': '迈阿密', 'Cleveland': '克利夫兰', 'Honolulu': '火奴鲁鲁',
  'St. Louis': '圣路易斯', 'Pittsburgh': '匹兹堡', 'Cincinnati': '辛辛那提', 'Orlando': '奥兰多',
  'Richmond, VA': '里士满', 'Buffalo': '布法罗', 'Spokane': '斯波坎',
  
  // === 加拿大主要城市 ===
  'Toronto': '多伦多', 'Montreal': '蒙特利尔', 'Vancouver': '温哥华', 'Calgary': '卡尔加里',
  'Edmonton': '埃德蒙顿', 'Ottawa': '渥太华', 'Winnipeg': '温尼伯', 'Quebec City': '魁北克城',
  'Hamilton, ON': '汉密尔顿', 'Kitchener': '基奇纳', 'London, ON': '伦敦', 'Victoria': '维多利亚',
  'Halifax': '哈利法克斯', 'Saskatoon': '萨斯卡通', 'Regina': '里贾纳', 'Kelowna': '基洛纳',
  'Richmond, BC': '列治文', 'Markham': '万锦', 'Vaughan': '旺市', 'Waterloo': '滑铁卢',
  
  // === 英国主要城市 ===
  'London': '伦敦', 'Birmingham': '伯明翰', 'Liverpool': '利物浦', 'Sheffield': '谢菲尔德',
  'Bristol': '布里斯托尔', 'Glasgow': '格拉斯哥', 'Leicester': '莱斯特', 'Edinburgh': '爱丁堡',
  'Leeds': '利兹', 'Cardiff': '卡迪夫', 'Manchester': '曼彻斯特', 'Belfast': '贝尔法斯特',
  'Newcastle upon Tyne': '纽卡斯尔', 'Brighton': '布莱顿', 'Plymouth': '普利茅斯', 'Aberdeen': '阿伯丁',
  'Portsmouth': '朴茨茅斯', 'York': '约克', 'Oxford': '牛津', 'Cambridge, UK': '剑桥',
  
  // === 日本主要城市 ===
  'Tokyo': '东京', 'Osaka': '大阪', 'Yokohama': '横滨', 'Nagoya': '名古屋',
  'Sapporo': '札幌', 'Fukuoka': '福冈', 'Kobe': '神户', 'Kyoto': '京都',
  'Kawasaki': '川崎', 'Saitama': '埼玉', 'Hiroshima': '广岛', 'Sendai': '仙台',
  'Kitakyushu': '北九州', 'Chiba': '千叶', 'Niigata': '新潟', 'Hamamatsu': '滨松',
  'Kumamoto': '熊本', 'Shizuoka': '静冈', 'Okayama': '冈山', 'Kanazawa': '金泽',
  
  // === 韩国主要城市 ===
  'Seoul': '首尔', 'Busan': '釜山', 'Incheon': '仁川', 'Daegu': '大邱',
  'Daejeon': '大田', 'Gwangju': '光州', 'Ulsan': '蔚山', 'Suwon': '水原',
  'Changwon': '昌原', 'Goyang': '高阳', 'Yongin': '龙仁', 'Seongnam': '城南',
  'Jeju': '济州', 'Cheonan': '天安', 'Jeonju': '全州', 'Ansan': '安山',
  
  // === 其他重要亚洲城市 ===
  'Bangkok': '曼谷', 'Kuala Lumpur': '吉隆坡', 'Jakarta': '雅加达',
  'Manila': '马尼拉', 'Ho Chi Minh City': '胡志明市', 'Hanoi': '河内', 'Yangon': '仰光',
  'Mumbai': '孟买', 'Delhi': '德里', 'Bangalore': '班加罗尔', 'Hyderabad': '海得拉巴',
  'Chennai': '金奈', 'Kolkata': '加尔各答', 'Pune': '浦那', 'Ahmedabad': '艾哈迈达巴德',
  
  // === 欧洲主要城市 ===
  'Paris': '巴黎', 'Berlin': '柏林', 'Madrid': '马德里', 'Rome': '罗马',
  'Amsterdam': '阿姆斯特丹', 'Vienna': '维也纳', 'Brussels': '布鲁塞尔', 'Prague': '布拉格',
  'Warsaw': '华沙', 'Budapest': '布达佩斯', 'Stockholm': '斯德哥尔摩', 'Copenhagen': '哥本哈根',
  'Oslo': '奥斯陆', 'Helsinki': '赫尔辛基', 'Zurich': '苏黎世', 'Geneva': '日内瓦',
  'Lisbon': '里斯本', 'Athens': '雅典', 'Dublin': '都柏林', 'Luxembourg': '卢森堡',
  
  // === 大洋洲主要城市 ===
  'Sydney': '悉尼', 'Melbourne': '墨尔本', 'Brisbane': '布里斯班', 'Perth': '珀斯',
  'Adelaide': '阿德莱德', 'Gold Coast': '黄金海岸', 'Newcastle, AU': '纽卡斯尔', 'Canberra': '堪培拉',
  'Auckland': '奥克兰', 'Wellington': '惠灵顿', 'Christchurch': '基督城', 'Hamilton, NZ': '哈密尔顿',
  
  // === 南美主要城市 ===
  'São Paulo': '圣保罗', 'Rio de Janeiro': '里约热内卢', 'Salvador': '萨尔瓦多', 'Brasília': '巴西利亚',
  'Buenos Aires': '布宜诺斯艾利斯', 'Córdoba': '科尔多瓦', 'Santiago': '圣地亚哥', 'Lima': '利马',
  'Bogotá': '波哥大', 'Medellín': '麦德林', 'Caracas': '加拉加斯', 'Quito': '基多',
  
  // === 非洲主要城市 ===
  'Cairo': '开罗', 'Lagos': '拉各斯', 'Johannesburg': '约翰内斯堡', 'Nairobi': '内罗毕',
  'Casablanca': '卡萨布兰卡', 'Cape Town': '开普敦', 'Alexandria': '亚历山大', 'Algiers': '阿尔及尔',
  
  // === 国家和地区名称 ===
  'China': '中国', 'People\'s Republic of China': '中华人民共和国',
  'United States': '美国', 'United States of America': '美利坚合众国', 'USA': '美国', 'US': '美国',
  'United Kingdom': '英国', 'Great Britain': '大不列颠', 'Britain': '英国', 'UK': '英国',
  'Canada': '加拿大', 'Japan': '日本', 'South Korea': '韩国', 'Korea': '韩国',
  'Singapore': '新加坡', 'Malaysia': '马来西亚', 'Thailand': '泰国', 'Vietnam': '越南',
  'Philippines': '菲律宾', 'Indonesia': '印度尼西亚', 'India': '印度', 'Australia': '澳大利亚',
  'New Zealand': '新西兰', 'France': '法国', 'Germany': '德国', 'Italy': '意大利',
  'Spain': '西班牙', 'Netherlands': '荷兰', 'Belgium': '比利时', 'Switzerland': '瑞士',
  'Austria': '奥地利', 'Sweden': '瑞典', 'Norway': '挪威', 'Denmark': '丹麦',
  'Finland': '芬兰', 'Poland': '波兰', 'Czech Republic': '捷克共和国', 'Hungary': '匈牙利',
  'Russia': '俄罗斯', 'Brazil': '巴西', 'Argentina': '阿根廷', 'Chile': '智利',
  'Mexico': '墨西哥', 'Egypt': '埃及', 'South Africa': '南非', 'Turkey': '土耳其',
  'Iran': '伊朗', 'Saudi Arabia': '沙特阿拉伯', 'UAE': '阿联酋', 'Israel': '以色列',
  
  // === 地理术语 ===
  'Province': '省', 'State': '州', 'County': '县', 'City': '市', 'District': '区',
  'Region': '地区', 'Prefecture': '府', 'Metropolitan Area': '都市区', 'Greater': '大',
  'North': '北', 'South': '南', 'East': '东', 'West': '西', 'Central': '中央',
  'New': '新', 'Saint': '圣', 'San': '圣', 'Santa': '圣'
};

// 缓存翻译结果，避免重复API调用
const translationCache: { [key: string]: { result: string; timestamp: number } } = {};
const TRANSLATION_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24小时缓存

// 翻译服务配置（优化版本，优先使用国内服务）
const TRANSLATION_SERVICES = [
  {
    name: 'Local Dictionary',
    isLocal: true, // 标记为本地服务，优先使用
    parser: (text: string) => locationTranslations[text] || weatherTranslations[text] || null
  },
  {
    name: 'MyMemory (免费)',
    url: (text: string) => `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|zh`,
    timeout: 5000,
    parser: (data: any) => data.responseStatus === 200 && data.responseData?.translatedText ? data.responseData.translatedText : null
  },
  {
    name: 'LibreTranslate (开源)',
    url: (text: string) => `https://libretranslate.de/translate`,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    timeout: 8000,
    body: (text: string) => JSON.stringify({
      q: text,
      source: 'en',
      target: 'zh',
      format: 'text'
    }),
    parser: (data: any) => data.translatedText || null
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
      // 处理本地字典服务
      if (service.isLocal && service.parser) {
        const localResult = service.parser(locationName);
        if (localResult) {
          return localResult;
        }
        continue;
      }
      
      // 处理API翻译服务
      if (!service.url) continue;
      
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

// 🚀 新增：格式化地名，避免显示逗号开头的问题
const formatLocationName = (...parts: string[]): string => {
  // 过滤掉空值、undefined、null和只有空格的字符串
  const validParts = parts
    .filter(part => part && typeof part === 'string' && part.trim() !== '')
    .map(part => part.trim());
  
  // 如果没有有效部分，返回默认值
  if (validParts.length === 0) {
    return '未知位置';
  }
  
  // 如果只有一个部分，直接返回
  if (validParts.length === 1) {
    return validParts[0];
  }
  
  // 多个部分用逗号加空格连接
  return validParts.join(', ');
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
      // 处理本地字典服务
      if (service.isLocal && service.parser) {
        const localResult = service.parser(description);
        if (localResult) {
          // 缓存翻译结果
          translationCache[`weather_${description}`] = { result: localResult, timestamp: Date.now() };
          return localResult;
        }
        continue;
      }
      
      // 处理API翻译服务
      if (!service.url) continue;
      
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
      location: formatLocationName(translatedArea, translatedCountry),
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
      location: formatLocationName(translatedArea, translatedCountry),
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
const CACHE_KEY = 'weather_diary_cache'; // localStorage缓存键

// 🚀 优化：从localStorage加载缓存
const loadCacheFromStorage = (): void => {
  try {
    const cachedData = localStorage.getItem(CACHE_KEY);
    if (cachedData) {
      const parsed = JSON.parse(cachedData);
      const now = Date.now();
      
      // 检查缓存是否仍然有效
      if (parsed.timestamp && (now - parsed.timestamp) < CACHE_DURATION) {
        weatherCache = parsed;
        console.log('📦 从本地存储加载天气缓存');
      } else {
        console.log('⏰ 本地天气缓存已过期，将清除');
        localStorage.removeItem(CACHE_KEY);
      }
    }
  } catch (error) {
    console.warn('加载天气缓存失败:', error);
    localStorage.removeItem(CACHE_KEY);
  }
};

// 🚀 优化：保存缓存到localStorage
const saveCacheToStorage = (): void => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(weatherCache));
  } catch (error) {
    console.warn('保存天气缓存失败:', error);
  }
};

// 🚀 优化：智能缓存检查
const checkWeatherCache = (locationKey: string): WeatherData | null => {
  const now = Date.now();
  
  // 先检查内存缓存
  if (
    weatherCache.data &&
    weatherCache.location === locationKey &&
    (now - weatherCache.timestamp) < CACHE_DURATION
  ) {
    console.log('✅ 使用内存缓存天气数据');
    return weatherCache.data;
  }
  
  // 如果内存缓存无效，尝试从localStorage加载
  if (!weatherCache.data || weatherCache.location !== locationKey) {
    loadCacheFromStorage();
    
    // 再次检查加载后的缓存
    if (
      weatherCache.data && 
      weatherCache.location === locationKey &&
      (now - weatherCache.timestamp) < CACHE_DURATION
    ) {
      console.log('✅ 使用本地存储缓存天气数据');
      return weatherCache.data;
    }
  }
  
  return null;
};

// 🚀 优化：更新缓存
const updateWeatherCache = (data: WeatherData, locationKey: string): void => {
  weatherCache = {
    data,
    timestamp: Date.now(),
    location: locationKey
  };
  
  // 同时保存到localStorage
  saveCacheToStorage();
  console.log('💾 天气数据已缓存到内存和本地存储');
};

// 初始化时加载缓存
loadCacheFromStorage();

// 防止并发请求的Promise缓存
let pendingWeatherRequest: Promise<WeatherData> | null = null;

// 主函数：获取天气数据 (优化版本，支持多API降级)
export const getWeatherData = async (): Promise<WeatherData> => {
  // 如果有正在进行的请求，直接返回该Promise
  if (pendingWeatherRequest) {
    console.log('🔄 检测到并发请求，复用进行中的API调用');
    return pendingWeatherRequest;
  }
  
  // 创建新的请求Promise
  pendingWeatherRequest = performActualWeatherRequest();
  
  try {
    const result = await pendingWeatherRequest;
    return result;
  } finally {
    // 请求完成后清理
    pendingWeatherRequest = null;
  }
};

// 实际的天气请求逻辑
const performActualWeatherRequest = async (): Promise<WeatherData> => {
  try {
    // 检查API配置状态
    checkApiConfiguration();
    
    // 获取用户位置
    const position = await getCurrentPosition();
    const { latitude, longitude } = position.coords;
    
    // 🚀 存储位置信息供WeatherDataSource组件使用
    localStorage.setItem('weather_last_position', JSON.stringify({
      latitude,
      longitude,
      timestamp: Date.now()
    }));
    
    // 生成位置键用于缓存
    const locationKey = `${latitude.toFixed(4)},${longitude.toFixed(4)}`;
    
    // 🚀 优化：使用智能缓存检查
    const cachedData = checkWeatherCache(locationKey);
    if (cachedData) {
      return cachedData;
    }

    // 根据位置智能选择API优先级
    let weatherData: WeatherData | null = null;
    const isInChina = isLocationInChina(latitude, longitude);
    
    if (isInChina) {
      // 国内用户策略：高德地图 > 和风天气 > wttr.in
      console.log('🇨🇳 国内用户，优先使用高德地图API');
      
      // 1. 优先尝试高德地图API
      if (WEATHER_APIS.amap.key) {
        try {
          console.log('正在尝试高德地图天气API...');
          weatherData = await fetchAmapWeatherData(latitude, longitude);
          console.log('✅ 高德地图API调用成功');
          // 🚀 记录当前使用的API源
          localStorage.setItem('weather_current_source', '高德地图');
        } catch (error) {
          console.warn('❌ 高德地图API调用失败，尝试备用API:', error);
        }
      }
      
      // 2. 如果高德地图失败，尝试和风天气
      if (!weatherData) {
        try {
          console.log('正在尝试和风天气API...');
          weatherData = await fetchQWeatherData(latitude, longitude);
          console.log('✅ 和风天气API调用成功');
          // 🚀 记录当前使用的API源
          localStorage.setItem('weather_current_source', '和风天气');
        } catch (error) {
          console.warn('❌ 和风天气API调用失败，尝试最后备用API:', error);
        }
      }
      
      // 3. 最后尝试wttr.in
      if (!weatherData) {
        try {
          console.log('正在尝试wttr.in API...');
          weatherData = await fetchWeatherData(latitude, longitude);
          console.log('✅ wttr.in API调用成功');
          // 🚀 记录当前使用的API源
          localStorage.setItem('weather_current_source', 'wttr.in');
        } catch (error) {
          console.warn('❌ wttr.in API调用失败:', error);
        }
      }
    } else {
      // 国外用户策略：直接使用wttr.in，快速响应
      console.log('🌍 国外用户，直接使用wttr.in API（快速响应）');
      
      // 1. 直接尝试wttr.in（国外用户最佳选择）
      try {
        console.log('正在尝试wttr.in API...');
        weatherData = await fetchWeatherData(latitude, longitude);
        console.log('✅ wttr.in API调用成功');
        // 🚀 记录当前使用的API源
        localStorage.setItem('weather_current_source', 'wttr.in');
      } catch (error) {
        console.warn('❌ wttr.in API调用失败，尝试备用API:', error);
        
        // 2. 如果wttr.in失败，在和风天气覆盖范围内尝试和风天气
        if (isQWeatherSupportedRegion(latitude, longitude)) {
          try {
            console.log('正在尝试和风天气API（备用）...');
            weatherData = await fetchQWeatherData(latitude, longitude);
            console.log('✅ 和风天气API调用成功');
            // 🚀 记录当前使用的API源
            localStorage.setItem('weather_current_source', '和风天气（备用）');
          } catch (error) {
            console.warn('❌ 和风天气API也调用失败:', error);
          }
        }
      }
    }
    
    // 如果所有API都失败，使用缓存或模拟数据
    if (!weatherData) {
      console.log('所有天气API调用失败，使用备用方案');
      // 优先使用缓存数据，即使过期
      if (weatherCache.data) {
        console.log('使用缓存天气数据');
        localStorage.setItem('weather_current_source', '缓存数据');
        return weatherCache.data;
      }
      // 最后使用模拟数据
      console.log('使用模拟天气数据');
      localStorage.setItem('weather_current_source', '模拟数据');
      return getMockWeatherData();
    }
    
    // 更新缓存
    updateWeatherCache(weatherData, locationKey);
    
    // 🚀 触发WeatherDataSource组件更新
    window.dispatchEvent(new CustomEvent('weatherDataUpdated'));
    
    return weatherData;

  } catch (error) {
    console.error('获取天气失败:', error);
    // 如果有缓存数据，即使过期也使用
    if (weatherCache.data) {
      console.log('位置获取失败，使用缓存天气数据');
      localStorage.setItem('weather_current_source', '缓存数据');
      return weatherCache.data;
    }
    // 使用模拟数据作为fallback
    console.log('使用模拟天气数据作为备用方案');
    localStorage.setItem('weather_current_source', '模拟数据');
    return getMockWeatherData();
  }
}; 
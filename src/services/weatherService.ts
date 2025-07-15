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
  // 为了测试，我们也可以手动设置为夜晚模式
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
    return parseWeatherData(data);
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

// 地名中英文对照
const locationTranslations: { [key: string]: string } = {
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
  'China': '中国',
  'United States': '美国',
  'United Kingdom': '英国',
  'Japan': '日本',
  'South Korea': '韩国',
  'Singapore': '新加坡'
};

// 解析天气数据
const parseWeatherData = (data: any): WeatherData => {
  const current = data.current_condition[0];
  const location = data.nearest_area[0];
  const now = new Date();
  const isNight = isNightTime(now);
  const moonPhase = calculateMoonPhase(now);
  
  const weatherConditions = {
    'Sunny': { condition: isNight ? 'night' : 'sunny', icon: isNight ? MOON_PHASE_ICONS[moonPhase] : '☀️' },
    'Clear': { condition: isNight ? 'night' : 'clear', icon: isNight ? MOON_PHASE_ICONS[moonPhase] : '🌙' },
    'Partly cloudy': { condition: 'cloudy', icon: isNight ? '☁️' : '⛅' },
    'Cloudy': { condition: 'cloudy', icon: '☁️' },
    'Overcast': { condition: 'cloudy', icon: '☁️' },
    'Light rain': { condition: 'rainy', icon: '🌧️' },
    'Moderate rain': { condition: 'rainy', icon: '🌧️' },
    'Heavy rain': { condition: 'rainy', icon: '⛈️' },
    'Thunderstorm': { condition: 'rainy', icon: '⛈️' },
    'Light snow': { condition: 'snowy', icon: '🌨️' },
    'Heavy snow': { condition: 'snowy', icon: '❄️' }
  };

  const weatherDesc = current.weatherDesc[0].value;
  const weatherInfo = weatherConditions[weatherDesc as keyof typeof weatherConditions] || { 
    condition: isNight ? 'night' : 'cloudy', 
    icon: isNight ? MOON_PHASE_ICONS[moonPhase] : '🌤️' 
  };

  // 翻译地名
  const areaName = location.areaName[0].value;
  const countryName = location.country[0].value;
  const translatedArea = locationTranslations[areaName] || areaName;
  const translatedCountry = locationTranslations[countryName] || countryName;
  
  // 翻译天气描述
  const translatedWeatherDesc = weatherTranslations[weatherDesc] || weatherDesc;

  return {
    location: `${translatedArea}, ${translatedCountry}`,
    description: isNight ? `夜晚 - ${translatedWeatherDesc}` : translatedWeatherDesc,
    temperature: current.temp_C,
    condition: weatherInfo.condition as WeatherData['condition'],
    icon: weatherInfo.icon,
    humidity: current.humidity,
    windSpeed: current.windspeedKmph,
    moonPhase: isNight ? moonPhase : undefined
  };
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
      moonPhase: isNight ? moonPhase : undefined
    },
    { 
      location: '上海市', 
      description: isNight ? '夜晚 - 多云' : '多云', 
      temperature: '18', 
      condition: 'cloudy' as const, 
      icon: '☁️' 
    },
    { 
      location: '广州市', 
      description: isNight ? '夜晚 - 小雨' : '小雨', 
      temperature: '25', 
      condition: 'rainy' as const, 
      icon: '🌧️' 
    },
    { 
      location: '成都市', 
      description: isNight ? '夜晚 - 阴天' : '阴天', 
      temperature: '16', 
      condition: 'cloudy' as const, 
      icon: '⛅' 
    }
  ];

  return mockWeatherData[Math.floor(Math.random() * mockWeatherData.length)];
};

// 主函数：获取天气数据
export const getWeatherData = async (): Promise<WeatherData> => {
  try {
    // 获取用户位置
    const position = await getCurrentPosition();
    const { latitude, longitude } = position.coords;

    // 获取天气数据
    const weatherData = await fetchWeatherData(latitude, longitude);
    return weatherData;

  } catch (error) {
    console.error('获取天气失败:', error);
    // 使用模拟数据作为fallback
    return getMockWeatherData();
  }
}; 
import { WeatherData } from '../types';

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

// 解析天气数据
const parseWeatherData = (data: any): WeatherData => {
  const current = data.current_condition[0];
  const location = data.nearest_area[0];
  
  const weatherConditions = {
    'Sunny': { condition: 'sunny', icon: '☀️' },
    'Clear': { condition: 'clear', icon: '🌙' },
    'Partly cloudy': { condition: 'cloudy', icon: '⛅' },
    'Cloudy': { condition: 'cloudy', icon: '☁️' },
    'Overcast': { condition: 'cloudy', icon: '☁️' },
    'Light rain': { condition: 'rainy', icon: '🌧️' },
    'Moderate rain': { condition: 'rainy', icon: '🌧️' },
    'Heavy rain': { condition: 'rainy', icon: '⛈️' },
    'Light snow': { condition: 'snowy', icon: '🌨️' },
    'Heavy snow': { condition: 'snowy', icon: '❄️' }
  };

  const weatherDesc = current.weatherDesc[0].value;
  const weatherInfo = weatherConditions[weatherDesc as keyof typeof weatherConditions] || { condition: 'cloudy', icon: '🌤️' };

  return {
    location: `${location.areaName[0].value}, ${location.country[0].value}`,
    description: weatherDesc,
    temperature: current.temp_C,
    condition: weatherInfo.condition as WeatherData['condition'],
    icon: weatherInfo.icon,
    humidity: current.humidity,
    windSpeed: current.windspeedKmph
  };
};

// 使用模拟天气数据
const useMockWeatherData = (): WeatherData => {
  const mockWeatherData = [
    { location: '北京市', description: '晴天', temperature: '22', condition: 'sunny' as const, icon: '☀️' },
    { location: '上海市', description: '多云', temperature: '18', condition: 'cloudy' as const, icon: '☁️' },
    { location: '广州市', description: '小雨', temperature: '25', condition: 'rainy' as const, icon: '🌧️' },
    { location: '成都市', description: '阴天', temperature: '16', condition: 'cloudy' as const, icon: '⛅' }
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
    return useMockWeatherData();
  }
}; 
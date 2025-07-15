// 应用状态管理
class DiaryApp {
    constructor() {
        this.currentWeather = null;
        this.currentMood = null;
        this.init();
    }

    // 初始化应用
    init() {
        this.setupEventListeners();
        this.displayCurrentDate();
        this.loadHistoryEntries();
        this.getWeatherData();
    }

    // 设置事件监听器
    setupEventListeners() {
        // 保存日记按钮
        document.getElementById('save-diary').addEventListener('click', () => {
            this.saveDiary();
        });

        // 刷新天气按钮
        document.getElementById('refresh-weather').addEventListener('click', () => {
            this.getWeatherData();
        });

        // 心情选择按钮
        document.querySelectorAll('.mood-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.selectMood(e.target);
            });
        });

        // 输入框自动保存草稿
        document.getElementById('diary-title-input').addEventListener('input', this.saveDraft.bind(this));
        document.getElementById('diary-content').addEventListener('input', this.saveDraft.bind(this));
    }

    // 显示当前日期
    displayCurrentDate() {
        const now = new Date();
        const options = { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric', 
            weekday: 'long' 
        };
        const dateString = now.toLocaleDateString('zh-CN', options);
        document.getElementById('current-date').textContent = dateString;
    }

    // 获取天气数据
    async getWeatherData() {
        try {
            // 更新UI显示正在获取天气
            this.updateWeatherUI({
                location: '获取位置中...',
                description: '获取天气中...',
                temperature: '--',
                icon: '🔄'
            });

            // 获取用户位置
            const position = await this.getCurrentPosition();
            const { latitude, longitude } = position.coords;

            // 使用免费的天气API获取天气数据
            const weatherData = await this.fetchWeatherData(latitude, longitude);
            
            this.currentWeather = weatherData;
            this.updateWeatherUI(weatherData);
            this.applyWeatherTheme(weatherData.condition);

        } catch (error) {
            console.error('获取天气失败:', error);
            // 使用模拟数据作为fallback
            this.useMockWeatherData();
        }
    }

    // 获取当前位置
    getCurrentPosition() {
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
    }

    // 获取天气数据（使用免费API）
    async fetchWeatherData(lat, lon) {
        try {
            // 使用 wttr.in 服务，这是一个免费的天气服务
            const response = await fetch(`https://wttr.in/${lat},${lon}?format=j1`);
            
            if (!response.ok) {
                throw new Error('天气API请求失败');
            }

            const data = await response.json();
            
            return await this.parseWeatherData(data);
        } catch (error) {
            console.error('天气API调用失败:', error);
            throw error;
        }
    }

    // 地名翻译词典
    getLocationTranslations() {
        return {
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
            'Spring Valley': '春谷',
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
    }

    // 天气描述翻译词典
    getWeatherTranslations() {
        return {
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
    }

    // 自动翻译地名
    async translateLocationName(locationName) {
        const locationTranslations = this.getLocationTranslations();
        
        // 先检查本地缓存
        if (locationTranslations[locationName]) {
            return locationTranslations[locationName];
        }
        
        try {
            // 使用免费的翻译服务
            const response = await fetch(
                `https://api.mymemory.translated.net/get?q=${encodeURIComponent(locationName)}&langpair=en|zh`
            );
            
            if (response.ok) {
                const data = await response.json();
                if (data.responseStatus === 200 && data.responseData?.translatedText) {
                    return data.responseData.translatedText;
                }
            }
        } catch (error) {
            console.warn('地名翻译API调用失败:', error);
        }
        
        // 如果翻译失败，返回原名
        return locationName;
    }

    // 解析天气数据
    async parseWeatherData(data) {
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
        const weatherInfo = weatherConditions[weatherDesc] || { condition: 'cloudy', icon: '🌤️' };

        // 翻译地名和天气描述
        const areaName = location.areaName[0].value;
        const countryName = location.country[0].value;
        
        try {
            const translatedArea = await this.translateLocationName(areaName);
            const translatedCountry = await this.translateLocationName(countryName);
            const weatherTranslations = this.getWeatherTranslations();
            const translatedWeatherDesc = weatherTranslations[weatherDesc] || weatherDesc;

            return {
                location: `${translatedArea}, ${translatedCountry}`,
                description: translatedWeatherDesc,
                temperature: current.temp_C,
                condition: weatherInfo.condition,
                icon: weatherInfo.icon,
                humidity: current.humidity,
                windSpeed: current.windspeedKmph
            };
        } catch (error) {
            console.warn('翻译失败，使用原始数据:', error);
            return {
                location: `${areaName}, ${countryName}`,
                description: weatherDesc,
                temperature: current.temp_C,
                condition: weatherInfo.condition,
                icon: weatherInfo.icon,
                humidity: current.humidity,
                windSpeed: current.windspeedKmph
            };
        }
    }

    // 使用模拟天气数据
    useMockWeatherData() {
        const mockWeatherData = [
            { location: '北京市', description: '晴天', temperature: '22', condition: 'sunny', icon: '☀️' },
            { location: '上海市', description: '多云', temperature: '18', condition: 'cloudy', icon: '☁️' },
            { location: '广州市', description: '小雨', temperature: '25', condition: 'rainy', icon: '🌧️' },
            { location: '成都市', description: '阴天', temperature: '16', condition: 'cloudy', icon: '⛅' }
        ];

        const randomWeather = mockWeatherData[Math.floor(Math.random() * mockWeatherData.length)];
        this.currentWeather = randomWeather;
        this.updateWeatherUI(randomWeather);
        this.applyWeatherTheme(randomWeather.condition);
    }

    // 更新天气UI
    updateWeatherUI(weatherData) {
        document.getElementById('location').textContent = weatherData.location;
        document.getElementById('weather-desc').textContent = weatherData.description;
        document.getElementById('temperature').textContent = `${weatherData.temperature}°C`;
        document.getElementById('weather-icon').textContent = weatherData.icon;
    }

    // 应用天气主题
    applyWeatherTheme(condition) {
        // 移除所有天气类
        const weatherClasses = ['sunny', 'cloudy', 'rainy', 'snowy', 'clear'];
        weatherClasses.forEach(cls => {
            document.body.classList.remove(cls);
        });

        // 添加当前天气类
        document.body.classList.add(condition);

        // 添加过渡动画
        document.body.style.transition = 'all 1s ease';
    }

    // 选择心情
    selectMood(button) {
        // 移除其他按钮的选中状态
        document.querySelectorAll('.mood-btn').forEach(btn => {
            btn.classList.remove('selected');
        });

        // 添加选中状态
        button.classList.add('selected');
        this.currentMood = {
            emoji: button.textContent,
            mood: button.dataset.mood
        };
    }

    // 保存日记
    saveDiary() {
        const title = document.getElementById('diary-title-input').value.trim();
        const content = document.getElementById('diary-content').value.trim();

        if (!title && !content) {
            alert('请至少填写标题或内容');
            return;
        }

        const diaryEntry = {
            id: Date.now().toString(),
            date: new Date().toISOString(),
            title: title || '无标题',
            content: content || '',
            mood: this.currentMood,
            weather: this.currentWeather
        };

        // 保存到localStorage
        const existingEntries = this.getDiaryEntries();
        existingEntries.unshift(diaryEntry);
        localStorage.setItem('diaryEntries', JSON.stringify(existingEntries));

        // 清空输入框
        document.getElementById('diary-title-input').value = '';
        document.getElementById('diary-content').value = '';
        document.querySelectorAll('.mood-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        this.currentMood = null;

        // 清除草稿
        localStorage.removeItem('diaryDraft');

        // 重新加载历史记录
        this.loadHistoryEntries();

        // 显示成功消息
        this.showSuccessMessage('日记保存成功！');
    }

    // 获取已保存的日记
    getDiaryEntries() {
        const entries = localStorage.getItem('diaryEntries');
        return entries ? JSON.parse(entries) : [];
    }

    // 加载历史记录
    loadHistoryEntries() {
        const entries = this.getDiaryEntries();
        const historyList = document.getElementById('history-list');
        
        if (entries.length === 0) {
            historyList.innerHTML = '<p style="text-align: center; color: var(--text-light); font-style: italic;">还没有日记记录，开始写第一篇吧！</p>';
            return;
        }

        historyList.innerHTML = entries.map(entry => this.createHistoryItemHTML(entry)).join('');
    }

    // 创建历史记录项HTML
    createHistoryItemHTML(entry) {
        const date = new Date(entry.date);
        const formattedDate = date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const weatherInfo = entry.weather ? 
            `<div class="history-weather">
                <span>${entry.weather.icon}</span>
                <span>${entry.weather.description} ${entry.weather.temperature}°C</span>
            </div>` : '';

        const moodInfo = entry.mood ? 
            `<div class="history-mood">${entry.mood.emoji}</div>` : '';

        return `
            <div class="history-item">
                <div class="history-header">
                    <div class="history-title">${entry.title}</div>
                    <div class="history-date">${formattedDate}</div>
                </div>
                ${weatherInfo}
                <div class="history-content">${entry.content}</div>
                ${moodInfo}
            </div>
        `;
    }

    // 保存草稿
    saveDraft() {
        const title = document.getElementById('diary-title-input').value;
        const content = document.getElementById('diary-content').value;
        
        const draft = { title, content };
        localStorage.setItem('diaryDraft', JSON.stringify(draft));
    }

    // 加载草稿
    loadDraft() {
        const draft = localStorage.getItem('diaryDraft');
        if (draft) {
            const { title, content } = JSON.parse(draft);
            document.getElementById('diary-title-input').value = title || '';
            document.getElementById('diary-content').value = content || '';
        }
    }

    // 显示成功消息
    showSuccessMessage(message) {
        const messageDiv = document.createElement('div');
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--primary-color);
            color: white;
            padding: 15px 20px;
            border-radius: var(--border-radius);
            box-shadow: var(--shadow);
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;
        messageDiv.textContent = message;

        // 添加动画样式
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);

        document.body.appendChild(messageDiv);

        // 3秒后自动移除
        setTimeout(() => {
            messageDiv.remove();
            style.remove();
        }, 3000);
    }
}

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
    const app = new DiaryApp();
    
    // 加载草稿
    app.loadDraft();
    
    // 添加键盘快捷键支持
    document.addEventListener('keydown', (e) => {
        // Ctrl+S 保存日记
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            app.saveDiary();
        }
        
        // Ctrl+R 刷新天气
        if (e.ctrlKey && e.key === 'r') {
            e.preventDefault();
            app.getWeatherData();
        }
    });

    // 添加离开页面前的提醒
    window.addEventListener('beforeunload', (e) => {
        const title = document.getElementById('diary-title-input').value.trim();
        const content = document.getElementById('diary-content').value.trim();
        
        if (title || content) {
            e.preventDefault();
            e.returnValue = '';
        }
    });
});
import React, { useState, useEffect, useRef, Suspense, lazy, useMemo, useCallback } from 'react';
import { 
  Container, 
  Box, 
  Paper, 
  Typography, 
  AppBar, 
  Toolbar,
  IconButton,
  useTheme,
  useMediaQuery,
  Skeleton
} from '@mui/material';
import { motion } from 'framer-motion';
import { Refresh } from '@mui/icons-material';
import WeatherHeader from './components/WeatherHeader';
import PrivacyStatus from './components/PrivacyStatus';
import WeatherDataSource from './components/WeatherDataSource';
import { WeatherData, DiaryEntry } from './types';
import { getWeatherData } from './services/weatherService';
import { saveHybridDiary, getHybridDiaries, initializeHybridStorage } from './services/hybridDiaryService';

import './styles/nightTheme.css';
import './styles/fonts.css';
import './styles/chipColors.css';

// 懒加载组件
const DiaryForm = lazy(() => import('./components/DiaryForm'));
const DiaryHistory = lazy(() => import('./components/DiaryHistory'));
const ThemeToggle = lazy(() => import('./components/ThemeToggle'));

const App: React.FC = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [diaryEntries, setDiaryEntries] = useState<DiaryEntry[]>([]);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [isInitialized, setIsInitialized] = useState(false);
  const initializationStarted = useRef(false);

  // 🚀 使用useCallback优化，避免依赖数组问题
  const loadInitialData = useCallback(async () => {
    try {
      console.log('🚀 开始初始化应用数据...', { started: initializationStarted.current });
      
      // 🚀 并行初始化：天气数据获取和存储初始化同时进行
      const [weatherData, storageResult] = await Promise.allSettled([
        getWeatherData(),
        initializeHybridStorage()
      ]);

      // 处理天气数据结果
      if (weatherData.status === 'fulfilled') {
        setWeather(weatherData.value);
        console.log('✅ 天气数据获取完成');
      } else {
        console.error('⚠️ 天气数据获取失败:', weatherData.reason);
      }
      // setWeatherLoading(false); // 🚀 天气数据加载完成 - REMOVED

      // 处理存储初始化结果
      if (storageResult.status === 'fulfilled') {
        console.log('✅ 存储初始化完成');
      } else {
        console.error('⚠️ 存储初始化失败:', storageResult.reason);
      }
      
      // 加载日记历史（依赖存储初始化完成）
      try {
        const entries = await getHybridDiaries();
        setDiaryEntries(entries);
        console.log('✅ 日记数据加载完成');
      } catch (diaryError) {
        console.error('⚠️ 日记数据加载失败:', diaryError);
        setDiaryEntries([]); // 设置空数组作为降级方案
      }
      // setDiaryLoading(false); // 🚀 日记数据加载完成 - REMOVED
      
      setIsInitialized(true);
      console.log('✅ 应用数据初始化完成');
    } catch (error) {
      console.error('加载数据失败:', error);
      setIsInitialized(true); // 即使失败也标记为已初始化，避免无限重试
      // setWeatherLoading(false); // REMOVED
      // setDiaryLoading(false); // REMOVED
      initializationStarted.current = false; // 重置，允许用户手动重试
    }
  }, []);

  useEffect(() => {
    if (!isInitialized && !initializationStarted.current) {
      initializationStarted.current = true;
      loadInitialData();
    }
  }, [isInitialized, loadInitialData]);

  const handleRefreshWeather = useCallback(async () => {
    try {
      const weatherData = await getWeatherData();
      setWeather(weatherData);
    } catch (error) {
      console.error('刷新天气失败:', error);
    }
  }, []);

  const handleSaveDiary = useCallback(async (entry: Omit<DiaryEntry, 'id' | 'timestamp'>) => {
    try {
      const newEntry = await saveHybridDiary(entry);
      setDiaryEntries(prev => [newEntry, ...prev]);
    } catch (error) {
      console.error('保存日记失败:', error);
    }
  }, []);

  // 🚀 修复useMemo依赖数组
  const weatherTheme = useMemo(() => {
    if (!weather?.condition) {
      return 'default';
    }
    return weather.condition;
  }, [weather]);

  return (
    <Box
      className={weatherTheme === 'night' ? 'night-theme' : ''}
      sx={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${getWeatherGradient(weatherTheme)})`,
        transition: 'background 1s ease',
      }}
    >
      <AppBar 
        position="static" 
        sx={{ 
          background: weatherTheme === 'night' ? 'rgba(52, 73, 94, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          boxShadow: 'none',
          borderBottom: weatherTheme === 'night' ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(255, 255, 255, 0.2)'
        }}
      >
        <Toolbar>
          <Typography 
            variant="h6" 
            component="div" 
            className="gradient-title"
            sx={{ 
              flexGrow: 1,
              fontFamily: '"Ma Shan Zheng", cursive',
              fontSize: '1.5rem',
              color: weatherTheme === 'night' ? '#64b5f6' : 'inherit'
            }}
          >
            天气日记本
          </Typography>
          
          <IconButton 
            onClick={handleRefreshWeather}
            sx={{ 
              color: weatherTheme === 'night' ? '#64b5f6' : 'primary.main'
            }}
          >
            <Refresh />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 3 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <WeatherHeader weather={weather} onRefresh={handleRefreshWeather} />
        </motion.div>

        <Box sx={{ mt: 3, display: 'flex', gap: 3, flexDirection: isMobile ? 'column' : 'row' }}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            style={{ flex: 1 }}
          >
            <Paper 
              elevation={3}
              sx={{ 
                p: 3, 
                background: weatherTheme === 'night' ? 'rgba(52, 73, 94, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                borderRadius: 3
              }}
            >
              <Suspense fallback={
                <Box>
                  <Skeleton variant="text" width="60%" height={32} sx={{ mb: 2 }} />
                  <Skeleton variant="rectangular" width="100%" height={60} sx={{ mb: 2 }} />
                  <Skeleton variant="rectangular" width="100%" height={120} sx={{ mb: 2 }} />
                  <Box display="flex" gap={1} mb={2}>
                    {[1,2,3,4,5,6].map(i => (
                      <Skeleton key={i} variant="rounded" width={60} height={32} />
                    ))}
                  </Box>
                  <Skeleton variant="rectangular" width="100%" height={40} />
                </Box>
              }>
                <DiaryForm onSave={handleSaveDiary} weather={weather} />
              </Suspense>
            </Paper>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            style={{ flex: 1 }}
          >
            <Paper 
              elevation={3}
              sx={{ 
                p: 3, 
                background: weatherTheme === 'night' ? 'rgba(52, 73, 94, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                borderRadius: 3
              }}
            >
              <Suspense fallback={
                <Box>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <Skeleton variant="rectangular" width={24} height={24} />
                    <Skeleton variant="text" width="40%" height={24} />
                    <Skeleton variant="text" width="20%" height={20} />
                  </Box>
                  {[1,2,3].map(i => (
                    <Box key={i} sx={{ mb: 2, p: 2, border: '1px solid #eee', borderRadius: 2 }}>
                      <Box display="flex" justifyContent="space-between" mb={1}>
                        <Skeleton variant="text" width="30%" height={20} />
                        <Skeleton variant="circular" width={20} height={20} />
                      </Box>
                      <Skeleton variant="text" width="60%" height={16} sx={{ mb: 1 }} />
                      <Box display="flex" gap={1}>
                        <Skeleton variant="rounded" width={60} height={24} />
                        <Skeleton variant="rounded" width={80} height={24} />
                      </Box>
                    </Box>
                  ))}
                </Box>
              }>
                <DiaryHistory entries={diaryEntries} onUpdate={async () => {
                  try {
                    const entries = await getHybridDiaries();
                    setDiaryEntries(entries);
                  } catch (error) {
                    console.error('更新日记列表失败:', error);
                  }
                }} />
              </Suspense>
            </Paper>
          </motion.div>
        </Box>
      </Container>
      
      {/* 夜晚主题的月亮装饰 */}
      {weatherTheme === 'night' && (
        <div className="moon-container" />
      )}
      
      {/* 主题切换按钮 */}
      <Suspense fallback={null}>
        <ThemeToggle />
      </Suspense>
      
      {/* 隐私保障状态 */}
      <PrivacyStatus />
      <WeatherDataSource />
    </Box>
  );
};

// 根据天气条件返回渐变背景
const getWeatherGradient = (condition: string) => {
  switch (condition) {
    case 'sunny':
      return '#ffd54f 0%, #ffcc02 100%';
    case 'cloudy':
      return '#cfd8dc 0%, #90a4ae 100%';
    case 'rainy':
      return '#64b5f6 0%, #1976d2 100%';
    case 'snowy':
      return '#eceff1 0%, #cfd8dc 100%';
    case 'clear':
      return '#ce93d8 0%, #9c27b0 100%';
    case 'night':
      return '#1a252f 0%, #2c3e50 50%, #1a252f 100%';
    default:
      return '#667eea 0%, #764ba2 100%';
  }
};

export default App;

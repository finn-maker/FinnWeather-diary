import React, { useState, useEffect, Suspense, lazy } from 'react';
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
import { motion, AnimatePresence } from 'framer-motion';
import { Refresh, Menu } from '@mui/icons-material';
import WeatherHeader from './components/WeatherHeader';
import { WeatherData, DiaryEntry } from './types';
import { getWeatherData } from './services/weatherService';
import { saveDiaryEntry, getDiaryEntries } from './services/diaryService';

// 懒加载组件
const DiaryForm = lazy(() => import('./components/DiaryForm'));
const DiaryHistory = lazy(() => import('./components/DiaryHistory'));
const ThemeToggle = lazy(() => import('./components/ThemeToggle'));
import './styles/nightTheme.css';
import './styles/fonts.css';
import './styles/chipColors.css';

const App: React.FC = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [diaryEntries, setDiaryEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      // 加载天气数据
      const weatherData = await getWeatherData();
      setWeather(weatherData);
      
      // 加载日记历史
      const entries = getDiaryEntries();
      setDiaryEntries(entries);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshWeather = async () => {
    try {
      const weatherData = await getWeatherData();
      setWeather(weatherData);
    } catch (error) {
      console.error('刷新天气失败:', error);
    }
  };

  const handleSaveDiary = (entry: Omit<DiaryEntry, 'id' | 'timestamp'>) => {
    const newEntry = saveDiaryEntry(entry);
    setDiaryEntries(prev => [newEntry, ...prev]);
  };

  const getWeatherTheme = () => {
    if (!weather) {
      console.log('🎨 主题检测: 天气数据为空，使用默认主题');
      return 'default';
    }
    console.log('🎨 天气条件:', weather.condition);
    console.log('🎨 当前主题:', weather.condition);
    return weather.condition;
  };

  return (
    <Box
      className={getWeatherTheme() === 'night' ? 'night-theme' : ''}
      sx={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${getWeatherGradient(getWeatherTheme())})`,
        transition: 'background 1s ease',
      }}
    >
      <AppBar 
        position="static" 
        sx={{ 
          background: getWeatherTheme() === 'night' ? 'rgba(52, 73, 94, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          boxShadow: 'none',
          borderBottom: getWeatherTheme() === 'night' ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(255, 255, 255, 0.2)'
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
              color: getWeatherTheme() === 'night' ? '#64b5f6' : 'inherit'
            }}
          >
            天气日记本
          </Typography>
          <IconButton 
            onClick={handleRefreshWeather}
            sx={{ color: getWeatherTheme() === 'night' ? '#64b5f6' : 'primary.main' }}
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
                background: getWeatherTheme() === 'night' ? 'rgba(52, 73, 94, 0.95)' : 'rgba(255, 255, 255, 0.95)',
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
                background: getWeatherTheme() === 'night' ? 'rgba(52, 73, 94, 0.95)' : 'rgba(255, 255, 255, 0.95)',
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
                <DiaryHistory entries={diaryEntries} onUpdate={() => {
                  const entries = getDiaryEntries();
                  setDiaryEntries(entries);
                }} />
              </Suspense>
            </Paper>
          </motion.div>
        </Box>
      </Container>
      
      {/* 夜晚主题的月亮装饰 */}
      {getWeatherTheme() === 'night' && (
        <div className="moon-container" />
      )}
      
      {/* 主题切换按钮 */}
      <Suspense fallback={null}>
        <ThemeToggle />
      </Suspense>
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

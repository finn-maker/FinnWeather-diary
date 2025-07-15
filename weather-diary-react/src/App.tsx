import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Box, 
  Paper, 
  Typography, 
  AppBar, 
  Toolbar,
  IconButton,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { Refresh, Menu } from '@mui/icons-material';
import WeatherHeader from './components/WeatherHeader';
import DiaryForm from './components/DiaryForm';
import DiaryHistory from './components/DiaryHistory';
import { WeatherData, DiaryEntry } from './types';
import { getWeatherData } from './services/weatherService';
import { saveDiaryEntry, getDiaryEntries } from './services/diaryService';

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
    if (!weather) return 'default';
    return weather.condition;
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${getWeatherGradient(getWeatherTheme())})`,
        transition: 'background 1s ease',
      }}
    >
      <AppBar 
        position="static" 
        sx={{ 
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          boxShadow: 'none',
          borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
        }}
      >
        <Toolbar>
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ 
              flexGrow: 1,
              fontFamily: '"Ma Shan Zheng", cursive',
              color: 'primary.main'
            }}
          >
            天气日记本
          </Typography>
          <IconButton 
            onClick={handleRefreshWeather}
            sx={{ color: 'primary.main' }}
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
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                borderRadius: 3
              }}
            >
              <DiaryForm onSave={handleSaveDiary} weather={weather} />
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
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                borderRadius: 3
              }}
            >
              <DiaryHistory entries={diaryEntries} />
            </Paper>
          </motion.div>
        </Box>
      </Container>
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
    default:
      return '#667eea 0%, #764ba2 100%';
  }
};

export default App;

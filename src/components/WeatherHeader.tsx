import React, { memo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Chip,
  Skeleton,
  useTheme
} from '@mui/material';
import { motion } from 'framer-motion';
import { Refresh, LocationOn, Thermostat, Opacity, Air } from '@mui/icons-material';
import { WeatherData, MOON_PHASE_ICONS } from '../types';
import { createWeatherDisplay } from '../services/weatherService';

interface WeatherHeaderProps {
  weather: WeatherData | null;
  onRefresh: () => void;
}

const WeatherHeader: React.FC<WeatherHeaderProps> = ({ weather, onRefresh }) => {
  const theme = useTheme();
  
  const getWeatherTheme = () => {
    if (!weather) return 'default';
    return weather.condition;
  };

  if (!weather) {
    return (
      <Card sx={{ 
        background: getWeatherTheme() === 'night' ? 'rgba(52, 73, 94, 0.95)' : 'rgba(255, 255, 255, 0.95)', 
        backdropFilter: 'blur(10px)' 
      }}>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={2}>
              <Skeleton variant="circular" width={60} height={60} />
              <Box>
                <Skeleton variant="text" width={200} height={24} />
                <Skeleton variant="text" width={150} height={20} />
                <Skeleton variant="text" width={100} height={32} />
              </Box>
            </Box>
            <Skeleton variant="circular" width={50} height={50} />
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Card sx={{ 
        background: getWeatherTheme() === 'night' ? 'rgba(52, 73, 94, 0.95)' : 'rgba(255, 255, 255, 0.95)', 
        backdropFilter: 'blur(10px)',
        borderRadius: 3
      }}>
        <CardContent sx={{ p: 3 }}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={3}>
              {/* 天气图标 */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <Typography variant="h1" sx={{ 
                  fontSize: '4rem', 
                  lineHeight: 1,
                  filter: getWeatherTheme() === 'night' ? 'brightness(1.2) contrast(1.1)' : 'none'
                }}>
                  {weather.icon}
                </Typography>
              </motion.div>

              {/* 天气信息 */}
              <Box>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <LocationOn sx={{ color: getWeatherTheme() === 'night' ? '#64b5f6' : 'primary.main' }} fontSize="small" />
                  <Typography variant="h6" sx={{ color: getWeatherTheme() === 'night' ? '#64b5f6' : 'primary.main' }}>
                    {weather.location}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Typography variant="body1" sx={{ 
                    fontSize: '1.8rem',
                    lineHeight: 1
                  }}>
                    {createWeatherDisplay(weather.description).emoji}
                  </Typography>
                  <Typography variant="body1" sx={{ 
                    color: getWeatherTheme() === 'night' ? '#b0b0b0' : 'text.secondary',
                    fontSize: '1rem',
                    fontWeight: 400,
                    fontFamily: '"Noto Sans SC", sans-serif',
                    opacity: 0.9
                  }}>
                    {createWeatherDisplay(weather.description).text}
                  </Typography>
                </Box>

                {/* 温度显示 */}
                <Box display="flex" alignItems="center" gap={0.5} mb={2}>
                  <Thermostat sx={{ color: getWeatherTheme() === 'night' ? '#64b5f6' : 'primary.main' }} fontSize="small" />
                  <Typography variant="h4" sx={{ color: getWeatherTheme() === 'night' ? '#64b5f6' : 'primary.main' }} fontWeight="bold">
                    {weather.temperature}°C
                  </Typography>
                </Box>

                {/* 天气详情芯片 - 响应式布局 */}
                <Box 
                  display="flex" 
                  flexWrap="wrap" 
                  gap={1}
                  sx={{
                    '& .MuiChip-root': {
                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      height: { xs: 28, sm: 32 }
                    }
                  }}
                >
                  {weather.humidity && (
                    <Chip
                      icon={<Opacity />}
                      label={`湿度 ${weather.humidity}%`}
                      size="small"
                      variant="outlined"
                      data-weather-info="humidity"
                    />
                  )}

                  {weather.windSpeed && (
                    <Chip
                      icon={<Air />}
                      label={`风速 ${weather.windSpeed}km/h`}
                      size="small"
                      variant="outlined"
                      data-weather-info="wind"
                    />
                  )}

                  {weather.moonPhase && (
                    <Chip
                      label={`月相 ${MOON_PHASE_ICONS[weather.moonPhase as keyof typeof MOON_PHASE_ICONS]}`}
                      size="small"
                      variant="outlined"
                      data-moon-phase={weather.moonPhase}
                      sx={{ fontSize: { xs: '1rem', sm: '1.2rem' } }}
                    />
                  )}
                </Box>
              </Box>
            </Box>

            {/* 刷新按钮 */}
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <IconButton
                onClick={onRefresh}
                sx={{
                  background: theme.palette.primary.main,
                  color: 'white',
                  '&:hover': {
                    background: theme.palette.primary.dark,
                  },
                  width: 56,
                  height: 56,
                }}
              >
                <Refresh />
              </IconButton>
            </motion.div>
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default memo(WeatherHeader); 
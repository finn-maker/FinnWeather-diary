import React from 'react';
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
import { WeatherData } from '../types';

interface WeatherHeaderProps {
  weather: WeatherData | null;
  onRefresh: () => void;
}

const WeatherHeader: React.FC<WeatherHeaderProps> = ({ weather, onRefresh }) => {
  const theme = useTheme();

  if (!weather) {
    return (
      <Card sx={{ background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)' }}>
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
        background: 'rgba(255, 255, 255, 0.95)', 
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
                <Typography variant="h1" sx={{ fontSize: '4rem', lineHeight: 1 }}>
                  {weather.icon}
                </Typography>
              </motion.div>

              {/* 天气信息 */}
              <Box>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <LocationOn color="primary" fontSize="small" />
                  <Typography variant="h6" color="primary">
                    {weather.location}
                  </Typography>
                </Box>
                
                <Typography variant="body1" color="text.secondary" mb={1}>
                  {weather.description}
                </Typography>

                <Box display="flex" alignItems="center" gap={2}>
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <Thermostat color="primary" fontSize="small" />
                    <Typography variant="h4" color="primary" fontWeight="bold">
                      {weather.temperature}°C
                    </Typography>
                  </Box>

                  {weather.humidity && (
                    <Chip
                      icon={<Opacity />}
                      label={`湿度 ${weather.humidity}%`}
                      size="small"
                      variant="outlined"
                    />
                  )}

                  {weather.windSpeed && (
                    <Chip
                      icon={<Air />}
                      label={`风速 ${weather.windSpeed}km/h`}
                      size="small"
                      variant="outlined"
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

export default WeatherHeader; 
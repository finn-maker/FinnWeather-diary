import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Chip,
  useTheme 
} from '@mui/material';
import { DarkMode, LightMode } from '@mui/icons-material';

const ThemeToggle: React.FC = () => {
  const [isNightMode, setIsNightMode] = useState(false);
  const theme = useTheme();

  // 只在开发环境显示主题切换按钮
  const isDevelopment = process.env.NODE_ENV === 'development';

  useEffect(() => {
    // 检查URL参数
    const urlParams = new URLSearchParams(window.location.search);
    const forceNight = urlParams.get('night') === 'true';
    setIsNightMode(forceNight);
  }, []);

  const toggleNightMode = () => {
    const newNightMode = !isNightMode;
    setIsNightMode(newNightMode);
    
    // 更新URL参数
    const url = new URL(window.location.href);
    if (newNightMode) {
      url.searchParams.set('night', 'true');
    } else {
      url.searchParams.delete('night');
    }
    window.history.replaceState({}, '', url.toString());
    
    // 刷新页面以应用新主题
    window.location.reload();
  };

  // 生产环境不显示主题切换按钮
  if (!isDevelopment) {
    return null;
  }

  return (
    <Box 
      sx={{ 
        position: 'fixed', 
        top: { xs: 10, sm: 20 }, 
        left: { xs: 10, sm: 20 }, 
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: 1
      }}
    >
      <Button
        variant="contained"
        startIcon={isNightMode ? <LightMode /> : <DarkMode />}
        onClick={toggleNightMode}
        size="small"
        sx={{
          fontSize: { xs: '0.75rem', sm: '0.875rem' },
          padding: { xs: '4px 8px', sm: '6px 16px' },
          background: isNightMode 
            ? 'rgba(255, 255, 255, 0.2)' 
            : 'rgba(0, 0, 0, 0.2)',
          color: isNightMode ? 'white' : 'black',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          '&:hover': {
            background: isNightMode 
              ? 'rgba(255, 255, 255, 0.3)' 
              : 'rgba(0, 0, 0, 0.3)',
          }
        }}
      >
        {isNightMode ? '切换到白天' : '切换到夜晚'}
      </Button>
      
      <Chip
        label={isNightMode ? '🌙 夜晚模式' : '☀️ 白天模式'}
        size="small"
        sx={{
          fontSize: { xs: '0.7rem', sm: '0.8rem' },
          height: { xs: 24, sm: 28 },
          background: isNightMode 
            ? 'rgba(255, 255, 255, 0.1)' 
            : 'rgba(0, 0, 0, 0.1)',
          color: isNightMode ? 'white' : 'black',
          border: '1px solid rgba(255, 255, 255, 0.3)',
        }}
      />
    </Box>
  );
};

export default ThemeToggle; 
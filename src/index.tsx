import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import App from './App';

// Service Worker 注册 (仅在生产环境)
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('✅ SW 注册成功:', registration.scope);
        
        // 检查是否有新的Service Worker等待激活
        if (registration.waiting) {
          console.log('🔄 SW 更新可用，等待激活');
        }
        
        // 监听Service Worker更新
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  console.log('🔄 SW 新版本可用，刷新页面以应用更新');
                } else {
                  console.log('✅ SW 首次安装完成');
                }
              }
            });
          }
        });
      })
      .catch((error) => {
        console.error('❌ SW 注册失败:', error);
      });
      
    // 监听Service Worker消息
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'CACHE_UPDATED') {
        console.log('📦 缓存已更新:', event.data.url);
      }
    });
  });
} else if ('serviceWorker' in navigator) {
  console.log('🚧 开发环境：跳过Service Worker注册');
} else {
  console.log('⚠️ 浏览器不支持Service Worker');
}

// 创建Material-UI主题
const theme = createTheme({
  palette: {
    primary: {
      main: '#4a90e2',
    },
    secondary: {
      main: '#f5f7fa',
    },
  },
  typography: {
    fontFamily: '"Noto Sans SC", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontFamily: '"Ma Shan Zheng", cursive',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          textTransform: 'none',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        },
      },
    },
  },
});

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <App />
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
 
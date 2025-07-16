import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Chip,
  Alert,
  Stack
} from '@mui/material';
import { 
  Cloud, 
  CloudOff, 
  CheckCircle,
  AlertCircle,
  Wifi,
  WifiOff
} from 'lucide-react';
import { 
  getStorageStatus
} from '../services/hybridDiaryService';
import { isFirebaseConfigured } from '../services/firebaseConfig';

interface CloudStorageManagerProps {
  onStorageChange?: () => void;
}

const CloudStorageManager: React.FC<CloudStorageManagerProps> = ({ onStorageChange }) => {
  const [storageStatus, setStorageStatus] = useState(getStorageStatus());

  // 定期更新存储状态
  useEffect(() => {
    const interval = setInterval(() => {
      setStorageStatus(getStorageStatus());
    }, 5000); // 每5秒更新一次状态

    return () => clearInterval(interval);
  }, []);

  // 获取模式标签
  const getModeLabel = (mode: string) => {
    switch (mode) {
      case 'local': return '本地存储';
      case 'cloud': return '云端存储';
      case 'hybrid': return '混合存储';
      default: return '未知模式';
    }
  };

  // 获取状态颜色
  const getStatusColor = () => {
    if (!isFirebaseConfigured()) return 'warning';
    if (storageStatus.cloudAvailable) return 'success';
    return 'error';
  };

  // 获取状态图标
  const getStatusIcon = () => {
    if (!isFirebaseConfigured()) return <AlertCircle size={16} />;
    if (storageStatus.cloudAvailable) return <Cloud size={16} />;
    return <CloudOff size={16} />;
  };

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        {getStatusIcon()}
        存储状态
      </Typography>

      <Stack spacing={2}>
        {/* 存储模式状态 */}
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="body2" color="text.secondary">
            当前模式
          </Typography>
          <Chip 
            label={getModeLabel(storageStatus.mode)}
            color={getStatusColor()}
            size="small"
            variant="outlined"
          />
        </Box>

        {/* Firebase配置状态 */}
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="body2" color="text.secondary">
            云端服务
          </Typography>
          <Alert 
            severity={isFirebaseConfigured() ? 'success' : 'warning'} 
            sx={{ 
              py: 0.5, 
              px: 1, 
              fontSize: '0.75rem',
              minWidth: 'auto',
              '& .MuiAlert-message': { 
                py: 0,
                display: 'flex',
                alignItems: 'center'
              }
            }}
          >
            {isFirebaseConfigured() ? (
              <Box display="flex" alignItems="center" gap={1}>
                <CheckCircle size={14} />
                已配置
              </Box>
            ) : (
              <Box display="flex" alignItems="center" gap={1}>
                <AlertCircle size={14} />
                未配置
              </Box>
            )}
          </Alert>
        </Box>

        {/* 连接状态 */}
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="body2" color="text.secondary">
            连接状态
          </Typography>
          <Chip 
            icon={storageStatus.cloudAvailable ? <Wifi size={14} /> : <WifiOff size={14} />}
            label={storageStatus.cloudAvailable ? '已连接' : '未连接'}
            color={storageStatus.cloudAvailable ? 'success' : 'default'}
            size="small"
            variant="outlined"
          />
        </Box>

        {/* 最后同步时间 */}
        {storageStatus.lastSync && (
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="body2" color="text.secondary">
              最后同步
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {new Date(storageStatus.lastSync).toLocaleString()}
            </Typography>
          </Box>
        )}

        {/* 自动同步说明 */}
        {storageStatus.cloudAvailable && (
          <Alert severity="info" sx={{ fontSize: '0.8rem' }}>
            📱 存储已自动化：新增日记将自动同步到云端，无需手动操作
          </Alert>
        )}

        {/* Firebase未配置提示 */}
        {!isFirebaseConfigured() && (
          <Alert severity="info" sx={{ fontSize: '0.8rem' }}>
            💡 要启用云端存储，请配置Firebase。查看README文档了解详细步骤。
          </Alert>
        )}
      </Stack>
    </Box>
  );
};

export default CloudStorageManager; 
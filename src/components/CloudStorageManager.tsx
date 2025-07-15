import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  LinearProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  Stack,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import { 
  Cloud, 
  CloudOff, 
  RefreshCw, 
  Settings, 
  CheckCircle,
  AlertCircle,
  Wifi,
  WifiOff,
  Database,
  Server
} from 'lucide-react';
import { 
  getStorageStatus, 
  initializeHybridStorage,
  manualSyncToCloud,
  switchStorageMode,
  reinitializeCloud,
  StorageMode,
  STORAGE_MODES
} from '../services/hybridDiaryService';
import { isFirebaseConfigured } from '../services/firebaseConfig';

interface CloudStorageManagerProps {
  onStorageChange?: () => void;
}

const CloudStorageManager: React.FC<CloudStorageManagerProps> = ({ onStorageChange }) => {
  const [storageStatus, setStorageStatus] = useState(getStorageStatus());
  const [syncing, setSyncing] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [autoSync, setAutoSync] = useState(true);

  // 更新存储状态
  const updateStorageStatus = () => {
    setStorageStatus(getStorageStatus());
  };

  // 初始化云端存储
  const handleInitializeCloud = async () => {
    setSyncing(true);
    try {
      await initializeHybridStorage();
      updateStorageStatus();
      setSyncMessage({ type: 'success', message: '云端存储已初始化' });
      if (onStorageChange) onStorageChange();
    } catch (error) {
      setSyncMessage({ type: 'error', message: '初始化失败: ' + (error as Error).message });
    } finally {
      setSyncing(false);
    }
  };

  // 手动同步
  const handleManualSync = async () => {
    setSyncing(true);
    try {
      const result = await manualSyncToCloud();
      setSyncMessage({ 
        type: 'success', 
        message: `同步完成: 成功 ${result.success} 条, 失败 ${result.failed} 条` 
      });
      updateStorageStatus();
      if (onStorageChange) onStorageChange();
    } catch (error) {
      setSyncMessage({ type: 'error', message: '同步失败: ' + (error as Error).message });
    } finally {
      setSyncing(false);
    }
  };

  // 切换存储模式
  const handleModeSwitch = async (mode: StorageMode) => {
    try {
      await switchStorageMode(mode);
      updateStorageStatus();
      setSyncMessage({ type: 'success', message: `已切换到${getModeLabel(mode)}模式` });
      if (onStorageChange) onStorageChange();
    } catch (error) {
      setSyncMessage({ type: 'error', message: '切换模式失败: ' + (error as Error).message });
    }
  };

  // 重新连接云端
  const handleReconnect = async () => {
    setSyncing(true);
    try {
      const success = await reinitializeCloud();
      if (success) {
        updateStorageStatus();
        setSyncMessage({ type: 'success', message: '云端连接已恢复' });
        if (onStorageChange) onStorageChange();
      } else {
        setSyncMessage({ type: 'error', message: '云端连接失败' });
      }
    } catch (error) {
      setSyncMessage({ type: 'error', message: '重连失败: ' + (error as Error).message });
    } finally {
      setSyncing(false);
    }
  };

  // 获取模式标签
  const getModeLabel = (mode: StorageMode): string => {
    switch (mode) {
      case 'local': return '本地存储';
      case 'cloud': return '云端存储';
      case 'hybrid': return '混合存储';
      default: return '未知';
    }
  };

  // 获取状态颜色
  const getStatusColor = () => {
    if (storageStatus.cloudAvailable && storageStatus.mode === 'hybrid') return 'success';
    if (storageStatus.mode === 'local') return 'warning';
    return 'error';
  };

  // 获取状态图标
  const getStatusIcon = () => {
    if (storageStatus.cloudAvailable && storageStatus.mode === 'hybrid') {
      return <Cloud size={20} />;
    }
    if (storageStatus.mode === 'local') {
      return <Database size={20} />;
    }
    return <CloudOff size={20} />;
  };

  // 定期更新状态
  useEffect(() => {
    const interval = setInterval(updateStorageStatus, 30000); // 30秒更新一次
    return () => clearInterval(interval);
  }, []);

  // 自动隐藏消息
  useEffect(() => {
    if (syncMessage) {
      const timer = setTimeout(() => setSyncMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [syncMessage]);

  return (
    <Card elevation={2} sx={{ mb: 2 }}>
      <CardContent>
        {/* 存储状态显示 */}
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Box display="flex" alignItems="center" gap={1}>
            {getStatusIcon()}
            <Typography variant="h6" fontWeight="bold">
              云端存储
            </Typography>
            <Chip 
              label={getModeLabel(storageStatus.mode)}
              color={getStatusColor()}
              size="small"
            />
          </Box>
          
          <Box display="flex" alignItems="center" gap={1}>
            {storageStatus.syncing && <LinearProgress sx={{ width: 100 }} />}
            <IconButton size="small" onClick={() => setShowConfig(true)}>
              <Settings size={16} />
            </IconButton>
          </Box>
        </Box>

        {/* Firebase配置状态 */}
        <Box mb={2}>
          <Alert 
            severity={isFirebaseConfigured() ? 'info' : 'warning'} 
            sx={{ fontSize: '0.875rem' }}
          >
            {isFirebaseConfigured() ? (
              <Box display="flex" alignItems="center" gap={1}>
                <CheckCircle size={16} />
                Firebase已配置，支持云端存储
              </Box>
            ) : (
              <Box display="flex" alignItems="center" gap={1}>
                <AlertCircle size={16} />
                Firebase未配置，仅支持本地存储
              </Box>
            )}
          </Alert>
        </Box>

        {/* 连接状态和操作按钮 */}
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {!isFirebaseConfigured() && (
            <Alert severity="info" sx={{ width: '100%', fontSize: '0.8rem' }}>
              要启用云端存储，请配置Firebase。查看README文档了解详细步骤。
            </Alert>
          )}
          
          {isFirebaseConfigured() && !storageStatus.cloudAvailable && (
            <Button
              variant="contained"
              startIcon={<Cloud size={16} />}
              onClick={handleInitializeCloud}
              disabled={syncing}
              size="small"
            >
              启用云端存储
            </Button>
          )}
          
          {storageStatus.cloudAvailable && (
            <>
              <Button
                variant="outlined"
                startIcon={<RefreshCw size={16} />}
                onClick={handleManualSync}
                disabled={syncing}
                size="small"
              >
                手动同步
              </Button>
              
              {storageStatus.mode === 'local' && (
                <Button
                  variant="contained"
                  startIcon={<Cloud size={16} />}
                  onClick={() => handleModeSwitch(STORAGE_MODES.HYBRID)}
                  size="small"
                >
                  切换到混合模式
                </Button>
              )}
            </>
          )}
          
          {!storageStatus.cloudAvailable && isFirebaseConfigured() && (
            <Button
              variant="outlined"
              startIcon={<Wifi size={16} />}
              onClick={handleReconnect}
              disabled={syncing}
              size="small"
            >
              重新连接
            </Button>
          )}
        </Stack>

        {/* 同步信息 */}
        {storageStatus.lastSync && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            上次同步: {new Date(storageStatus.lastSync).toLocaleString()}
          </Typography>
        )}

        {/* 状态消息 */}
        {syncMessage && (
          <Alert 
            severity={syncMessage.type} 
            sx={{ mt: 2 }}
            onClose={() => setSyncMessage(null)}
          >
            {syncMessage.message}
          </Alert>
        )}
      </CardContent>

      {/* 配置对话框 */}
      <Dialog open={showConfig} onClose={() => setShowConfig(false)} maxWidth="sm" fullWidth>
        <DialogTitle>云端存储配置</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ pt: 1 }}>
            {/* 存储模式选择 */}
            <Box>
              <Typography variant="subtitle2" gutterBottom>存储模式</Typography>
              <Stack direction="row" spacing={1}>
                {Object.values(STORAGE_MODES).map((mode) => (
                  <Button
                    key={mode}
                    variant={storageStatus.mode === mode ? 'contained' : 'outlined'}
                    onClick={() => handleModeSwitch(mode)}
                    disabled={mode === 'cloud' && !storageStatus.cloudAvailable}
                    size="small"
                  >
                    {getModeLabel(mode)}
                  </Button>
                ))}
              </Stack>
            </Box>

            <Divider />

            {/* 自动同步设置 */}
            <FormControlLabel
              control={
                <Switch
                  checked={autoSync}
                  onChange={(e) => setAutoSync(e.target.checked)}
                />
              }
              label="自动同步 (每5分钟)"
            />

            {/* 存储状态信息 */}
            <Box>
              <Typography variant="subtitle2" gutterBottom>存储状态</Typography>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Typography variant="body2">模式:</Typography>
                <Chip label={getModeLabel(storageStatus.mode)} size="small" />
              </Box>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Typography variant="body2">云端可用:</Typography>
                {storageStatus.cloudAvailable ? 
                  <CheckCircle size={16} color="green" /> : 
                  <CloudOff size={16} color="gray" />
                }
              </Box>
              {storageStatus.syncing && (
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="body2">正在同步...</Typography>
                  <LinearProgress sx={{ width: 100 }} />
                </Box>
              )}
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowConfig(false)}>关闭</Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default CloudStorageManager; 
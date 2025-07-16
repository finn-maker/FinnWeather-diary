import React, { useState, useRef } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  IconButton,
  Collapse,
  Button,
  Stack,
  Alert,
  Snackbar,
  Divider,
  useTheme
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  ChevronDown, 
  Trash2,
  Download,
  Upload,
  Calendar,
  MapPin,
  Thermometer
} from 'lucide-react';
import { DiaryEntry } from '../types';
import { downloadBackup, importDiaryData, formatDate } from '../services/diaryService';
import { deleteHybridDiary } from '../services/hybridDiaryService';
import { createWeatherDisplay } from '../services/weatherService';

interface DiaryHistoryProps {
  entries: DiaryEntry[];
  onUpdate?: () => void;
}

const DiaryHistory: React.FC<DiaryHistoryProps> = ({ entries, onUpdate }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<{ show: boolean; message: string; severity: 'success' | 'error' }>({
    show: false,
    message: '',
    severity: 'success'
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const theme = useTheme();

  const handleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteHybridDiary(id);
      if (onUpdate) {
        onUpdate();
      } else {
        // 备用方案：刷新页面
        window.location.reload();
      }
    } catch (error) {
      console.error('删除日记失败:', error);
    }
  };

  const handleExport = () => {
    downloadBackup();
    setImportResult({
      show: true,
      message: '日记备份已下载到本地',
      severity: 'success'
    });
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonData = e.target?.result as string;
        const result = importDiaryData(jsonData);
        
        setImportResult({
          show: true,
          message: result.message,
          severity: result.success ? 'success' : 'error'
        });

        if (result.success && onUpdate) {
          onUpdate();
        }
      } catch (error) {
        setImportResult({
          show: true,
          message: '文件读取失败',
          severity: 'error'
        });
      }
    };
    reader.readAsText(file);
    
    // 清空input值，允许重复选择同一文件
    event.target.value = '';
  };

  if (entries.length === 0) {
    return (
      <Box textAlign="center" py={4}>
        <Typography variant="h6" color="text.secondary" gutterBottom sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
          <BookOpen size={20} />
          📚 历史记录
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          还没有日记记录，开始记录你的第一天吧！
        </Typography>
        
        {/* 导入按钮 */}
        <Button
          variant="outlined"
          startIcon={<Upload size={16} />}
          onClick={handleImportClick}
          size="small"
        >
          导入备份数据
        </Button>
        <input
          type="file"
          ref={fileInputRef}
          accept=".json"
          style={{ display: 'none' }}
          onChange={handleFileImport}
        />
      </Box>
    );
  }

  return (
    <Box>
      {/* 标题和操作按钮 */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BookOpen size={20} color={theme.palette.primary.main} />
          📚 历史记录
        </Typography>
        <Chip 
          label={`${entries.length} 条记录`} 
          size="small" 
          color="primary" 
          variant="outlined"
        />
      </Box>

      {/* 备份操作按钮 */}
      <Box mb={2}>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<Download size={16} />}
            onClick={handleExport}
          >
            导出备份
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<Upload size={16} />}
            onClick={handleImportClick}
          >
            导入备份
          </Button>
        </Stack>
        <input
          type="file"
          ref={fileInputRef}
          accept=".json"
          style={{ display: 'none' }}
          onChange={handleFileImport}
        />
      </Box>

      {/* 日记列表 */}
      <Stack spacing={2}>
        <AnimatePresence>
          {entries.map((entry, index) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ 
                duration: 0.3,
                delay: index * 0.05,
                ease: "easeOut"
              }}
            >
              <Card 
                elevation={2}
                sx={{
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    elevation: 4,
                    transform: 'translateY(-2px)',
                  },
                  background: theme.palette.mode === 'dark' 
                    ? 'rgba(255, 255, 255, 0.05)'
                    : 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <CardContent sx={{ p: 2 }}>
                  {/* 日记头部 */}
                  <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="h6" fontWeight="bold" noWrap sx={{ maxWidth: 200 }}>
                        {entry.title}
                      </Typography>
                      <Chip
                        label={entry.mood.emoji}
                        size="small"
                        sx={{ fontSize: '1rem' }}
                      />
                    </Box>
                    
                    <Box display="flex" alignItems="center" gap={1}>
                      <IconButton
                        size="small"
                        onClick={() => handleExpand(entry.id)}
                      >
                        <ChevronDown 
                          size={20} 
                          style={{ 
                            transform: expandedId === entry.id ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.3s ease'
                          }} 
                        />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(entry.id)}
                        sx={{ color: 'error.main' }}
                      >
                        <Trash2 size={18} />
                      </IconButton>
                    </Box>
                  </Box>

                  {/* 日期和天气信息 */}
                  <Box sx={{ mb: 2 }}>
                    {/* 第一行：日期 */}
                    <Box display="flex" alignItems="center" gap={0.5} mb={1}>
                      <Calendar size={14} color={theme.palette.action.active} />
                      <Typography 
                        variant="body2" 
                        color="text.secondary"
                        sx={{
                          fontFamily: '"Noto Sans SC", sans-serif',
                          fontWeight: 500 
                        }}
                      >
                        {formatDate(entry.timestamp)}
                      </Typography>
                    </Box>
                    
                    {/* 第二行：地点和温度 */}
                    <Box 
                      display="flex" 
                      alignItems="center" 
                      gap={2} 
                      mb={1}
                      sx={{ flexWrap: { xs: 'wrap', sm: 'nowrap' } }}
                    >
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <MapPin size={14} color={theme.palette.action.active} />
                        <Typography 
                          variant="body2" 
                          color="text.secondary"
                          sx={{ 
                            fontFamily: '"Noto Sans SC", sans-serif',
                            fontWeight: 400,
                            minWidth: 'fit-content'
                          }}
                        >
                          {entry.weather.location}
                        </Typography>
                      </Box>
                      
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <Thermometer size={14} color={theme.palette.action.active} />
                        <Typography 
                          variant="body2" 
                          color="text.secondary"
                          sx={{ 
                            fontFamily: '"Noto Sans SC", sans-serif',
                            fontWeight: 500 
                          }}
                        >
                          {entry.weather.temperature}°C
                        </Typography>
                      </Box>
                    </Box>
                    
                    {/* 第三行：天气描述 */}
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography sx={{ 
                          fontSize: '1.5rem',
                          lineHeight: 1
                        }}>
                          {entry.weather.icon}
                        </Typography>
                        <Typography sx={{
                          fontSize: { xs: '0.85rem', sm: '0.9rem' },
                          fontFamily: '"Noto Sans SC", sans-serif',
                          fontWeight: 400,
                          color: 'text.secondary',
                          opacity: 0.8
                        }}>
                          {createWeatherDisplay(entry.weather.description).text}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  {/* 展开的内容 */}
                  <Collapse in={expandedId === entry.id}>
                    <Divider sx={{ my: 1 }} />
                    <Typography 
                      variant="body2" 
                      color="text.primary"
                      sx={{ 
                        whiteSpace: 'pre-wrap',
                        lineHeight: 1.6,
                        maxHeight: 200,
                        overflow: 'auto',
                        fontFamily: '"Noto Sans SC", sans-serif',
                        fontSize: { xs: '0.875rem', sm: '0.9rem' },
                        fontWeight: 400,
                        padding: 1,
                        backgroundColor: 'rgba(0, 0, 0, 0.02)',
                        borderRadius: 1,
                        border: '1px solid rgba(0, 0, 0, 0.05)'
                      }}
                    >
                      {entry.content}
                    </Typography>
                  </Collapse>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </Stack>

      {/* 导入结果提示 */}
      <Snackbar
        open={importResult.show}
        autoHideDuration={4000}
        onClose={() => setImportResult(prev => ({ ...prev, show: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          severity={importResult.severity} 
          onClose={() => setImportResult(prev => ({ ...prev, show: false }))}
        >
          {importResult.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default DiaryHistory; 
import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  IconButton,
  Collapse,
  List,
  ListItem,
  ListItemText,
  Divider,
  useTheme,
  Skeleton
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ExpandMore, 
  ExpandLess, 
  Delete, 
  Event,
  LocationOn,
  Thermostat
} from '@mui/icons-material';
import { DiaryEntry } from '../types';
import { formatDate, deleteDiaryEntry } from '../services/diaryService';

interface DiaryHistoryProps {
  entries: DiaryEntry[];
}

const DiaryHistory: React.FC<DiaryHistoryProps> = ({ entries }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const theme = useTheme();

  const handleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleDelete = (id: string) => {
    deleteDiaryEntry(id);
    // 这里需要通知父组件更新列表，暂时通过刷新页面实现
    window.location.reload();
  };

  if (entries.length === 0) {
    return (
      <Box textAlign="center" py={4}>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          📚 历史记录
        </Typography>
        <Typography variant="body2" color="text.secondary">
          还没有日记记录，开始记录你的第一天吧！
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
              <Typography variant="h5" gutterBottom className="gradient-title" sx={{ fontFamily: '"Ma Shan Zheng", cursive' }}>
          📚 历史记录 ({entries.length})
        </Typography>

      <AnimatePresence>
        {entries.map((entry, index) => (
          <motion.div
            key={entry.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card 
              sx={{ 
                mb: 2, 
                background: 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(5px)',
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.95)',
                  transform: 'translateY(-2px)',
                  boxShadow: theme.shadows[8],
                },
                transition: 'all 0.3s ease',
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
                      {expandedId === entry.id ? <ExpandLess /> : <ExpandMore />}
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(entry.id)}
                      sx={{ color: 'error.main' }}
                    >
                      <Delete />
                    </IconButton>
                  </Box>
                </Box>

                {/* 日期和天气信息 - 响应式布局 */}
                <Box sx={{ mb: 2 }}>
                  {/* 第一行：日期 */}
                  <Box display="flex" alignItems="center" gap={0.5} mb={1}>
                    <Event fontSize="small" color="action" />
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
                      <LocationOn fontSize="small" color="action" />
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
                      <Thermostat fontSize="small" color="action" />
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
                    <Chip
                      label={`${entry.weather.icon} ${entry.weather.description}`}
                      size="small"
                      variant="outlined"
                      data-weather-info="description"
                      sx={{
                        fontSize: { xs: '0.75rem', sm: '0.8rem' },
                        fontFamily: '"Noto Sans SC", sans-serif',
                        fontWeight: 500,
                        '& .MuiChip-label': {
                          fontFamily: '"Noto Sans SC", sans-serif'
                        }
                      }}
                    />
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
    </Box>
  );
};

export default DiaryHistory; 
import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Chip,
  Stack,
  Alert,
  Snackbar,
  useTheme
} from '@mui/material';
import { motion } from 'framer-motion';
import { Save, Edit3, Heart } from 'lucide-react';
import { WeatherData, DiaryEntry, MOOD_OPTIONS } from '../types';
import { getCurrentDateString } from '../services/diaryService';

interface DiaryFormProps {
  weather: WeatherData | null;
  onSave: (entry: Omit<DiaryEntry, 'id' | 'timestamp'>) => void;
}

const DiaryForm: React.FC<DiaryFormProps> = ({ weather, onSave }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedMood, setSelectedMood] = useState<typeof MOOD_OPTIONS[0] | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const theme = useTheme();

  // 自动保存草稿
  useEffect(() => {
    const saveDraft = () => {
      const draft = { title, content, mood: selectedMood };
      localStorage.setItem('diary_draft', JSON.stringify(draft));
    };

    const timeoutId = setTimeout(saveDraft, 1000);
    return () => clearTimeout(timeoutId);
  }, [title, content, selectedMood]);

  // 加载草稿
  useEffect(() => {
    const loadDraft = () => {
      const draft = localStorage.getItem('diary_draft');
      if (draft) {
        try {
          const { title: draftTitle, content: draftContent, mood: draftMood } = JSON.parse(draft);
          setTitle(draftTitle || '');
          setContent(draftContent || '');
          setSelectedMood(draftMood || null);
        } catch (error) {
          console.error('加载草稿失败:', error);
        }
      }
    };

    loadDraft();
  }, []);

  const handleSave = () => {
    if (!title.trim() || !content.trim() || !selectedMood || !weather) {
      return;
    }

    const entry: Omit<DiaryEntry, 'id' | 'timestamp'> = {
      title: title.trim(),
      content: content.trim(),
      mood: {
        emoji: selectedMood.emoji,
        type: selectedMood.type,
      },
      weather,
    };

    onSave(entry);
    
    // 清空表单
    setTitle('');
    setContent('');
    setSelectedMood(null);
    localStorage.removeItem('diary_draft');
    
    // 显示成功消息
    setShowSuccess(true);
  };

  const handleMoodSelect = (mood: typeof MOOD_OPTIONS[0]) => {
    setSelectedMood(mood);
  };

  const isFormValid = title.trim() && content.trim() && selectedMood && weather;

  return (
    <Box>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Typography variant="h5" gutterBottom className="gradient-title" sx={{ fontFamily: '"Ma Shan Zheng", cursive' }}>
          📝 记录今天
        </Typography>
        
        <Typography variant="body2" color="text.secondary" mb={3}>
          {getCurrentDateString()}
        </Typography>

        {/* 标题输入 */}
        <TextField
          fullWidth
          label="今天的标题"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="给今天起个标题吧..."
          variant="outlined"
          sx={{ mb: 3 }}
          InputProps={{
            startAdornment: <Edit3 size={20} style={{ marginRight: 8, color: theme.palette.primary.main }} />
          }}
        />

        {/* 内容输入 */}
        <TextField
          fullWidth
          label="记录今天"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="今天发生了什么有趣的事情？心情如何？和天气有关系吗？"
          variant="outlined"
          multiline
          rows={6}
          sx={{ mb: 3 }}
        />

        {/* 心情选择 */}
        <Box mb={3}>
          <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Heart size={20} color={theme.palette.primary.main} />
            今天心情：
          </Typography>
          
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {MOOD_OPTIONS.map((mood) => (
              <motion.div
                key={mood.type}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Chip
                  label={`${mood.emoji} ${mood.label}`}
                  onClick={() => handleMoodSelect(mood)}
                  variant={selectedMood?.type === mood.type ? 'filled' : 'outlined'}
                  color={selectedMood?.type === mood.type ? 'primary' : 'default'}
                  data-mood={mood.type}
                  sx={{ 
                    cursor: 'pointer',
                    fontSize: '1rem',
                    '&:hover': {
                      transform: 'scale(1.05)',
                    }
                  }}
                />
              </motion.div>
            ))}
          </Stack>
        </Box>

        {/* 保存按钮 */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={handleSave}
            disabled={!isFormValid}
            startIcon={<Save />}
            sx={{
              py: 1.5,
              fontSize: '1.1rem',
              fontWeight: 'bold',
              background: isFormValid 
                ? `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.dark} 90%)`
                : undefined,
            }}
          >
            保存今天的日记
          </Button>
        </motion.div>

        {/* 成功提示 */}
        <Snackbar
          open={showSuccess}
          autoHideDuration={3000}
          onClose={() => setShowSuccess(false)}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert 
            onClose={() => setShowSuccess(false)} 
            severity="success" 
            sx={{ width: '100%' }}
          >
            日记保存成功！ ✨
          </Alert>
        </Snackbar>
      </motion.div>
    </Box>
  );
};

export default DiaryForm; 
export interface WeatherData {
  location: string;
  description: string;
  temperature: string;
  condition: 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'clear';
  icon: string;
  humidity?: string;
  windSpeed?: string;
}

export interface DiaryEntry {
  id: string;
  title: string;
  content: string;
  mood: {
    emoji: string;
    type: string;
  };
  weather: WeatherData;
  timestamp: number;
}

export interface MoodOption {
  emoji: string;
  type: string;
  label: string;
}

export const MOOD_OPTIONS: MoodOption[] = [
  { emoji: '😊', type: 'happy', label: '开心' },
  { emoji: '😢', type: 'sad', label: '难过' },
  { emoji: '🤩', type: 'excited', label: '兴奋' },
  { emoji: '😌', type: 'calm', label: '平静' },
  { emoji: '😤', type: 'angry', label: '生气' },
  { emoji: '😴', type: 'tired', label: '疲惫' },
]; 
export interface WeatherData {
  location: string;
  description: string;
  temperature: string;
  condition: 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'clear' | 'night';
  icon: string;
  humidity?: string;
  windSpeed?: string;
  moonPhase?: string; // 月相信息
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

// 月相类型
export type MoonPhase = 'new' | 'waxing_crescent' | 'first_quarter' | 'waxing_gibbous' | 'full' | 'waning_gibbous' | 'last_quarter' | 'waning_crescent';

// 月相图标映射
export const MOON_PHASE_ICONS: Record<MoonPhase, string> = {
  new: '🌑',           // 新月
  waxing_crescent: '🌒', // 娥眉月
  first_quarter: '🌓',   // 上弦月
  waxing_gibbous: '🌔',  // 盈凸月
  full: '🌕',           // 满月
  waning_gibbous: '🌖',  // 亏凸月
  last_quarter: '🌗',    // 下弦月
  waning_crescent: '🌘', // 残月
}; 
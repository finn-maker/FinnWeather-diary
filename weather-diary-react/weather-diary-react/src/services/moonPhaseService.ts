import { MoonPhase } from '../types';

// 更精确的月相计算
export const calculateMoonPhase = (date: Date): MoonPhase => {
  // 使用天文算法计算月相
  // 基于 Julian Day Number 计算
  
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  // 计算 Julian Day Number
  let jd = 367 * year - Math.floor(7 * (year + Math.floor((month + 9) / 12)) / 4) + Math.floor(275 * month / 9) + day + 1721013.5;
  
  // 计算从2000年1月6日新月开始的天数
  const newMoon2000 = 2451550.1;
  const daysSinceNewMoon2000 = jd - newMoon2000;
  
  // 月相周期约为29.53058867天
  const lunarCycle = 29.53058867;
  const phase = (daysSinceNewMoon2000 % lunarCycle) / lunarCycle;
  
  // 根据相位确定月相
  if (phase < 0.0625) return 'new';           // 新月 (0-1/16)
  if (phase < 0.1875) return 'waxing_crescent'; // 娥眉月 (1/16-3/16)
  if (phase < 0.3125) return 'first_quarter';   // 上弦月 (3/16-5/16)
  if (phase < 0.4375) return 'waxing_gibbous';  // 盈凸月 (5/16-7/16)
  if (phase < 0.5625) return 'full';           // 满月 (7/16-9/16)
  if (phase < 0.6875) return 'waning_gibbous';  // 亏凸月 (9/16-11/16)
  if (phase < 0.8125) return 'last_quarter';    // 下弦月 (11/16-13/16)
  if (phase < 0.9375) return 'waning_crescent'; // 残月 (13/16-15/16)
  return 'new'; // 新月 (15/16-1)
};

// 获取月相的中文名称
export const getMoonPhaseName = (phase: MoonPhase): string => {
  const phaseNames = {
    new: '新月',
    waxing_crescent: '娥眉月',
    first_quarter: '上弦月',
    waxing_gibbous: '盈凸月',
    full: '满月',
    waning_gibbous: '亏凸月',
    last_quarter: '下弦月',
    waning_crescent: '残月'
  };
  return phaseNames[phase];
};

// 获取月相的详细描述
export const getMoonPhaseDescription = (phase: MoonPhase): string => {
  const descriptions = {
    new: '新月时分，月亮几乎不可见',
    waxing_crescent: '娥眉月，月亮开始显现',
    first_quarter: '上弦月，月亮呈现半圆形',
    waxing_gibbous: '盈凸月，月亮逐渐圆满',
    full: '满月时分，月亮最圆最亮',
    waning_gibbous: '亏凸月，月亮开始减少',
    last_quarter: '下弦月，月亮再次呈现半圆',
    waning_crescent: '残月，月亮即将消失'
  };
  return descriptions[phase];
}; 
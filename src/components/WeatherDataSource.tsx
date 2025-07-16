// 天气数据来源显示组件
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Cloud, MapPin, Wifi, Globe, Zap } from 'lucide-react';
import { getApiInfo } from '../config/apiConfig';

interface WeatherDataSourceProps {
  className?: string;
}

interface WeatherSourceInfo {
  currentSource: string;
  location: {
    isInChina: boolean;
    latitude: number | null;
    longitude: number | null;
  };
  apiStatus: {
    amap: boolean;
    qweather: boolean;
    wttr: boolean;
  };
  strategy: string;
}

const WeatherDataSource: React.FC<WeatherDataSourceProps> = ({ className = '' }) => {
  const [sourceInfo, setSourceInfo] = useState<WeatherSourceInfo>({
    currentSource: '获取中...',
    location: { isInChina: false, latitude: null, longitude: null },
    apiStatus: { amap: false, qweather: false, wttr: true },
    strategy: '正在检测位置...'
  });
  const [isExpanded, setIsExpanded] = useState(false);

  // 控制月亮容器的显示
  useEffect(() => {
    const moonContainer = document.querySelector('.moon-container');
    if (moonContainer) {
      if (isExpanded) {
        moonContainer.setAttribute('style', 'display: none !important');
      } else {
        moonContainer.removeAttribute('style');
      }
    }
  }, [isExpanded]);

  // 获取天气数据源信息
  useEffect(() => {
    const updateSourceInfo = () => {
      const apiInfo = getApiInfo();
      
      // 从localStorage获取位置信息
      const lastPosition = localStorage.getItem('weather_last_position');
      let location = { isInChina: false, latitude: null, longitude: null };
      
      if (lastPosition) {
        try {
          const pos = JSON.parse(lastPosition);
          location.latitude = pos.latitude;
          location.longitude = pos.longitude;
          // 简单的中国境内判断
          location.isInChina = pos.latitude >= 18 && pos.latitude <= 54 && 
                              pos.longitude >= 73 && pos.longitude <= 135;
        } catch (error) {
          console.warn('解析位置信息失败:', error);
        }
      }

      // 从localStorage获取当前使用的API源
      const currentSource = localStorage.getItem('weather_current_source') || '未知';
      
      // API状态
      const apiStatus = {
        amap: apiInfo.amap.configured,
        qweather: apiInfo.qweather.configured,
        wttr: true // wttr.in 不需要配置
      };

      // 策略描述
      let strategy = '';
      if (location.isInChina) {
        strategy = '国内用户：高德地图 → 和风天气 → wttr.in';
      } else {
        strategy = '国外用户：wttr.in → 和风天气';
      }

      setSourceInfo({
        currentSource,
        location,
        apiStatus,
        strategy
      });
    };

    updateSourceInfo();
    
    // 监听存储变化
    const handleStorageChange = () => {
      updateSourceInfo();
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // 监听自定义事件（当天气数据更新时）
    const handleWeatherUpdate = () => {
      setTimeout(updateSourceInfo, 100); // 延迟一下确保数据已更新
    };
    
    window.addEventListener('weatherDataUpdated', handleWeatherUpdate);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('weatherDataUpdated', handleWeatherUpdate);
    };
  }, []);

  const getSourceIcon = (source: string) => {
    if (source.includes('高德') || source.includes('amap')) return <MapPin size={14} />;
    if (source.includes('和风') || source.includes('qweather')) return <Cloud size={14} />;
    if (source.includes('wttr')) return <Globe size={14} />;
    return <Wifi size={14} />;
  };

  const getSourceColor = (source: string) => {
    if (source.includes('高德') || source.includes('amap')) return '#4CAF50';
    if (source.includes('和风') || source.includes('qweather')) return '#2196F3';
    if (source.includes('wttr')) return '#FF9800';
    return '#9E9E9E';
  };

  const buttonStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: '70px', // 在隐私保护上方
    right: '20px',
    zIndex: 999999,
    pointerEvents: 'auto'
  };

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'rgba(0, 0, 0, 0.5)',
    zIndex: 999998,
    backdropFilter: 'blur(5px)'
  };

  const panelStyle: React.CSSProperties = {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    background: 'white',
    borderRadius: '16px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    zIndex: 999999,
    minWidth: '320px',
    maxWidth: '90vw',
    maxHeight: '80vh',
    overflow: 'auto'
  };

  const toggle = () => setIsExpanded(!isExpanded);

  const WeatherSourceContent = () => (
    <div style={panelStyle}>
      <div style={{ 
        padding: '24px',
        borderBottom: '1px solid #f0f0f0'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px',
          marginBottom: '16px'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '12px',
            padding: '12px',
            color: 'white'
          }}>
            <Cloud size={24} />
          </div>
          <div>
            <h2 style={{ 
              margin: 0, 
              fontSize: '20px', 
              fontWeight: 600,
              color: '#1f2937'
            }}>
              天气数据来源
            </h2>
            <p style={{ 
              margin: 0, 
              fontSize: '14px', 
              color: '#6b7280'
            }}>
              实时天气数据获取状态
            </p>
          </div>
        </div>
      </div>

      <div style={{ padding: '24px' }}>
        {/* 当前数据源 */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ 
            margin: '0 0 12px 0', 
            fontSize: '16px', 
            fontWeight: 600,
            color: '#1f2937'
          }}>
            当前数据源
          </h3>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 16px',
            background: '#f8fafc',
            borderRadius: '8px',
            border: `2px solid ${getSourceColor(sourceInfo.currentSource)}`
          }}>
            <div style={{ color: getSourceColor(sourceInfo.currentSource) }}>
              {getSourceIcon(sourceInfo.currentSource)}
            </div>
            <span style={{ 
              fontWeight: 500,
              color: '#1f2937'
            }}>
              {sourceInfo.currentSource}
            </span>
          </div>
        </div>

        {/* 位置信息 */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ 
            margin: '0 0 12px 0', 
            fontSize: '16px', 
            fontWeight: 600,
            color: '#1f2937'
          }}>
            位置信息
          </h3>
          <div style={{
            padding: '12px 16px',
            background: '#f8fafc',
            borderRadius: '8px',
            fontSize: '14px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <MapPin size={14} style={{ color: '#6b7280' }} />
              <span style={{ color: '#374151' }}>
                {sourceInfo.location.isInChina ? '🇨🇳 中国境内' : '🌍 海外地区'}
              </span>
            </div>
            {sourceInfo.location.latitude && sourceInfo.location.longitude && (
              <div style={{ fontSize: '12px', color: '#6b7280' }}>
                坐标: {sourceInfo.location.latitude.toFixed(4)}, {sourceInfo.location.longitude.toFixed(4)}
              </div>
            )}
          </div>
        </div>

        {/* API状态 */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ 
            margin: '0 0 12px 0', 
            fontSize: '16px', 
            fontWeight: 600,
            color: '#1f2937'
          }}>
            API配置状态
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 12px',
              background: '#f8fafc',
              borderRadius: '6px',
              fontSize: '14px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MapPin size={14} style={{ color: '#4CAF50' }} />
                <span>高德地图</span>
              </div>
              <span style={{ 
                color: sourceInfo.apiStatus.amap ? '#16a34a' : '#dc2626',
                fontWeight: 500
              }}>
                {sourceInfo.apiStatus.amap ? '✅ 已配置' : '❌ 未配置'}
              </span>
            </div>
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 12px',
              background: '#f8fafc',
              borderRadius: '6px',
              fontSize: '14px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Cloud size={14} style={{ color: '#2196F3' }} />
                <span>和风天气</span>
              </div>
              <span style={{ 
                color: sourceInfo.apiStatus.qweather ? '#16a34a' : '#dc2626',
                fontWeight: 500
              }}>
                {sourceInfo.apiStatus.qweather ? '✅ 已配置' : '❌ 未配置'}
              </span>
            </div>
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 12px',
              background: '#f8fafc',
              borderRadius: '6px',
              fontSize: '14px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Globe size={14} style={{ color: '#FF9800' }} />
                <span>wttr.in</span>
              </div>
              <span style={{ 
                color: '#16a34a',
                fontWeight: 500
              }}>
                ✅ 无需配置
              </span>
            </div>
          </div>
        </div>

        {/* 选择策略 */}
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ 
            margin: '0 0 12px 0', 
            fontSize: '16px', 
            fontWeight: 600,
            color: '#1f2937'
          }}>
            选择策略
          </h3>
          <div style={{
            padding: '12px 16px',
            background: '#eff6ff',
            borderRadius: '8px',
            fontSize: '14px',
            color: '#1e40af',
            border: '1px solid #dbeafe'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Zap size={14} />
              <span style={{ fontWeight: 500 }}>{sourceInfo.strategy}</span>
            </div>
          </div>
        </div>

        {/* 关闭按钮 */}
        <button
          onClick={toggle}
          style={{
            width: '100%',
            padding: '12px',
            background: '#f3f4f6',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500,
            color: '#374151',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#e5e7eb'}
          onMouseLeave={(e) => e.currentTarget.style.background = '#f3f4f6'}
        >
          关闭
        </button>
      </div>
    </div>
  );

  return createPortal(
    <>
      {/* 切换按钮 */}
      <button
        onClick={toggle}
        style={{
          ...buttonStyle,
          background: 'rgba(99, 102, 241, 0.9)',
          border: 'none',
          borderRadius: '12px',
          padding: '8px 12px',
          cursor: 'pointer',
          color: 'white',
          fontSize: '12px',
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          transition: 'all 0.2s ease',
          transform: isExpanded ? 'scale(0.95)' : 'scale(1)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(99, 102, 241, 1)';
          e.currentTarget.style.transform = 'scale(1.05)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(99, 102, 241, 0.9)';
          e.currentTarget.style.transform = isExpanded ? 'scale(0.95)' : 'scale(1)';
        }}
        className={className}
      >
        {getSourceIcon(sourceInfo.currentSource)}
        <span>数据源</span>
      </button>

      {/* 展开面板 */}
      {isExpanded && (
        <>
          <div style={overlayStyle} onClick={toggle} />
          <WeatherSourceContent />
        </>
      )}
    </>,
    document.body
  );
};

export default WeatherDataSource; 
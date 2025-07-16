// 隐私状态显示组件
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Shield, Lock, Eye, AlertTriangle } from 'lucide-react';
import { getEncryptionStatus } from '../services/encryptionService';

interface PrivacyStatusProps {
  className?: string;
}

const PrivacyStatus: React.FC<PrivacyStatusProps> = ({ className = '' }) => {
  const [encryptionStatus, setEncryptionStatus] = useState(getEncryptionStatus());
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

  useEffect(() => {
    setEncryptionStatus(getEncryptionStatus());
  }, []);

  const { supported, algorithm, keyLength, description } = encryptionStatus;

  const buttonStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: '20px', // 移到右下角
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

  const detailsStyle: React.CSSProperties = {
    position: 'fixed',
    top: '70px',
    right: '20px',
    width: '320px',
    background: 'white',
    borderRadius: '16px',
    boxShadow: '0 25px 80px rgba(0, 0, 0, 0.4)',
    border: '2px solid rgba(255, 255, 255, 0.8)',
    overflow: 'hidden',
    zIndex: 1000000,
    backdropFilter: 'blur(15px)'
  };

  const indicatorStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    borderRadius: '20px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 500,
    transition: 'all 0.2s ease',
    userSelect: 'none',
    background: supported 
      ? 'linear-gradient(135deg, #10b981, #059669)' 
      : 'linear-gradient(135deg, #f59e0b, #d97706)',
    color: 'white'
  };

  return createPortal(
    <div style={buttonStyle}>
      {/* 状态指示器 */}
      <div 
        style={indicatorStyle}
        onClick={() => setIsExpanded(!isExpanded)}
        title="点击查看隐私保护详情"
      >
        {supported ? (
          <Shield size={16} />
        ) : (
          <AlertTriangle size={16} />
        )}
        <span>
          {supported ? '隐私保护' : '注意隐私'}
        </span>
      </div>

      {/* 详细信息面板 */}
      {isExpanded && (
        <>
          {/* 背景遮罩 */}
          <div 
            style={overlayStyle}
            onClick={() => setIsExpanded(false)}
          />
          
          <div style={detailsStyle}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px',
              background: '#f9fafb',
              borderBottom: '1px solid #e5e7eb'
            }}>
              <h3 style={{
                margin: 0,
                fontSize: '14px',
                fontWeight: 600,
                color: '#111827'
              }}>
                🔒 隐私保护状态
              </h3>
              <button 
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '18px',
                  cursor: 'pointer',
                  color: '#6b7280',
                  padding: 0,
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '4px'
                }}
                onClick={() => setIsExpanded(false)}
              >
                ×
              </button>
            </div>

            <div style={{
              padding: '16px',
              borderBottom: '1px solid #e5e7eb'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '8px',
                fontSize: '12px',
                color: '#374151'
              }}>
                <Lock size={16} />
                <span><strong>加密算法:</strong> {algorithm}</span>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '8px',
                fontSize: '12px',
                color: '#374151'
              }}>
                <Shield size={16} />
                <span><strong>密钥长度:</strong> {keyLength} 位</span>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '12px',
                color: '#374151'
              }}>
                <Eye size={16} />
                <span><strong>状态:</strong> {description}</span>
              </div>
            </div>

            {supported ? (
              <div style={{
                padding: '16px',
                borderBottom: '1px solid #e5e7eb'
              }}>
                <h4 style={{
                  margin: '0 0 12px 0',
                  fontSize: '13px',
                  color: '#065f46'
                }}>
                  ✅ 您的隐私得到完全保护
                </h4>
                <ul style={{
                  margin: 0,
                  paddingLeft: '16px',
                  fontSize: '12px',
                  lineHeight: 1.5
                }}>
                  <li style={{ color: '#065f46', marginBottom: '4px' }}>
                    🔒 <strong>端到端加密:</strong> 日记标题和内容在上传前已加密
                  </li>
                  <li style={{ color: '#065f46', marginBottom: '4px' }}>
                    🛡️ <strong>密钥安全:</strong> 加密密钥仅在您的设备上生成，服务器无法获取
                  </li>
                  <li style={{ color: '#065f46', marginBottom: '4px' }}>
                    🚫 <strong>无法窥探:</strong> 即使是数据库管理员也无法查看您的日记内容
                  </li>
                  <li style={{ color: '#065f46', marginBottom: '4px' }}>
                    🔐 <strong>强加密:</strong> 使用AES-256-GCM军用级加密算法
                  </li>
                  <li style={{ color: '#065f46' }}>
                    🎯 <strong>选择性加密:</strong> 只加密敏感内容，心情和天气数据用于统计分析
                  </li>
                </ul>
              </div>
            ) : (
              <div style={{
                padding: '16px',
                borderBottom: '1px solid #e5e7eb'
              }}>
                <h4 style={{
                  margin: '0 0 12px 0',
                  fontSize: '13px',
                  color: '#92400e'
                }}>
                  ⚠️ 隐私保护受限
                </h4>
                <ul style={{
                  margin: 0,
                  paddingLeft: '16px',
                  fontSize: '12px',
                  lineHeight: 1.5
                }}>
                  <li style={{ color: '#92400e', marginBottom: '4px' }}>
                    🔓 您的浏览器不支持加密功能
                  </li>
                  <li style={{ color: '#92400e', marginBottom: '4px' }}>
                    📝 日记内容将以明文形式存储
                  </li>
                  <li style={{ color: '#92400e', marginBottom: '4px' }}>
                    👁️ 数据库管理员可能看到您的日记内容
                  </li>
                  <li style={{ color: '#92400e' }}>
                    🔄 建议更新浏览器或使用现代浏览器
                  </li>
                </ul>
              </div>
            )}

            <div style={{ padding: '16px' }}>
              <details>
                <summary style={{
                  fontSize: '12px',
                  fontWeight: 500,
                  color: '#6b7280',
                  cursor: 'pointer',
                  marginBottom: '8px'
                }}>
                  🔧 技术详情
                </summary>
                <div style={{
                  fontSize: '11px',
                  color: '#6b7280',
                  lineHeight: 1.4
                }}>
                  <p style={{ margin: '4px 0' }}><strong>加密方式:</strong> 客户端加密（端到端）</p>
                  <p style={{ margin: '4px 0' }}><strong>密钥生成:</strong> PBKDF2 + 用户ID + 盐值</p>
                  <p style={{ margin: '4px 0' }}><strong>加密算法:</strong> AES-256-GCM</p>
                  <p style={{ margin: '4px 0' }}><strong>初始化向量:</strong> 每次加密随机生成</p>
                  <p style={{ margin: '4px 0' }}><strong>数据完整性:</strong> GCM模式提供认证加密</p>
                  <p style={{ margin: '4px 0' }}><strong>向后兼容:</strong> 自动检测并兼容未加密的旧数据</p>
                </div>
              </details>
            </div>
          </div>
        </>
      )}
    </div>,
    document.body
  );
};

export default PrivacyStatus; 
/**
 * 测测你是什么 - 主组件
 * Test Yourself Game - Main Component
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import type { TestYourselfProps, TestResult, TestStatus, DeviceFingerprint } from '../types';
import { 
  getDeviceFingerprint, 
  tryGetIPAddress, 
  generateDeviceHash, 
  selectResultIndex 
} from '../utils/fingerprint';
import { DEFAULT_RESULTS } from '../data/defaultResults';

const STORAGE_KEY = 'test-yourself-result';

export const TestYourself: React.FC<TestYourselfProps> = ({
  config,
  onResult,
  className = '',
}) => {
  const {
    gameTitle,
    gameDescription,
    buttonText = '长按开始测试',
    longPressDuration = 2000,
    results = DEFAULT_RESULTS,
    enableIPFetch = false,
    customSalt,
    resultStyle = 'card',
  } = config;

  const [status, setStatus] = useState<TestStatus>('idle');
  const [result, setResult] = useState<TestResult | null>(null);
  const [pressProgress, setPressProgress] = useState(0);
  const [ipWarning, setIpWarning] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const pressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  // 初始化：检查localStorage和获取IP
  useEffect(() => {
    const initializeTest = async () => {
      // 检查localStorage中是否已有结果
      const savedResult = localStorage.getItem(STORAGE_KEY);
      if (savedResult) {
        try {
          const parsed = JSON.parse(savedResult);
          setResult(parsed);
          setStatus('completed');
          setIsLoading(false);
          return;
        } catch (error) {
          console.error('解析保存的结果失败:', error);
        }
      }

      // 如果启用IP获取，尝试获取
      if (enableIPFetch) {
        const ip = await tryGetIPAddress();
        if (!ip) {
          setIpWarning('⚠️ 无法获取IP地址，将仅使用浏览器指纹生成结果');
        }
      }

      setIsLoading(false);
    };

    initializeTest();
  }, [enableIPFetch]);

  // 计算并保存结果
  const calculateResult = async (): Promise<TestResult> => {
    try {
      // 获取设备指纹
      const fingerprint: DeviceFingerprint = getDeviceFingerprint();

      // 如果启用IP，尝试获取
      if (enableIPFetch) {
        const ip = await tryGetIPAddress();
        if (ip) {
          fingerprint.ip = ip;
        }
      }

      // 使用实际结果数据（如果配置的results为空，使用默认数据）
      const actualResults = results.length > 0 ? results : DEFAULT_RESULTS;

      // 生成唯一哈希
      const hash = generateDeviceHash(fingerprint, customSalt);

      // 根据哈希选择结果
      const index = selectResultIndex(hash, actualResults.length);
      const selectedResult = actualResults[index];

      if (!selectedResult) {
        console.error('无法获取测试结果，index:', index, 'total:', actualResults.length);
        throw new Error('无法获取测试结果');
      }

      console.log('计算结果成功:', selectedResult);

      // 保存到localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedResult));

      return selectedResult;
    } catch (error) {
      console.error('计算结果失败:', error);
      throw error;
    }
  };

  // 处理按下
  const handlePressStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (status !== 'idle') return;

    // 阻止默认行为（防止移动端长按出现选择菜单）
    e.preventDefault();

    setStatus('pressing');
    startTimeRef.current = Date.now();

    // 设置进度更新
    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const progress = Math.min((elapsed / longPressDuration) * 100, 100);
      setPressProgress(progress);
    }, 16); // ~60fps

    // 设置完成定时器
    pressTimerRef.current = setTimeout(async () => {
      try {
        setPressProgress(100);
        
        // 清理进度定时器
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
        
        console.log('开始计算结果...');
        
        // 计算结果
        const testResult = await calculateResult();
        
        console.log('结果计算完成，更新状态:', testResult);
        
        // 先更新结果，再更新状态
        setResult(testResult);
        
        // 使用setTimeout确保状态更新
        setTimeout(() => {
          setStatus('completed');
          console.log('状态已更新为 completed');
        }, 0);

        // 调用回调
        if (onResult) {
          onResult(testResult);
        }
      } catch (error) {
        console.error('测试失败:', error);
        // 重置状态
        setStatus('idle');
        setPressProgress(0);
        alert('测试失败，请重试');
      }
    }, longPressDuration);

    // 添加全局监听器（用于PC端）
    if ('button' in e && e.button === 0) {
      // 鼠标事件
      const handleGlobalMouseUp = () => {
        handlePressEnd();
        document.removeEventListener('mouseup', handleGlobalMouseUp);
      };
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }
  };

  // 处理松开
  const handlePressEnd = () => {
    if (status !== 'pressing') return;

    // 清理定时器
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }

    // 重置状态
    setStatus('idle');
    setPressProgress(0);
  };

  // 处理鼠标离开（仅用于提示，不取消长按）
  const handleMouseLeave = (e: React.MouseEvent) => {
    // PC端：不取消长按，让用户可以移出按钮区域
    // 只要保持鼠标按下就继续
  };

  // 处理触摸移动（移动端）
  const handleTouchMove = (e: React.TouchEvent) => {
    // 检查手指是否移出按钮区域
    const touch = e.touches[0];
    if (!touch) return;
    
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    
    const isInside = 
      touch.clientX >= rect.left &&
      touch.clientX <= rect.right &&
      touch.clientY >= rect.top &&
      touch.clientY <= rect.bottom;
    
    // 如果移出按钮，取消长按（移动端才取消）
    if (!isInside && status === 'pressing') {
      handlePressEnd();
    }
  };

  // 清理
  useEffect(() => {
    return () => {
      if (pressTimerRef.current) {
        clearTimeout(pressTimerRef.current);
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  // 重新测试
  const handleReset = () => {
    localStorage.removeItem(STORAGE_KEY);
    setResult(null);
    setStatus('idle');
    setPressProgress(0);
  };

  // 背景容器样式
  const backgroundStyle: React.CSSProperties = {
    position: 'relative',
    minHeight: '100vh',
    overflow: 'hidden',
    background: 'linear-gradient(135deg, #f3e8ff 0%, #fce7f3 50%, #dbeafe 100%)',
  };

  // 装饰性光晕
  const DecorativeBackground = () => (
    <>
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '384px',
        height: '384px',
        background: 'radial-gradient(circle, rgba(192, 132, 252, 0.3) 0%, transparent 70%)',
        borderRadius: '50%',
        filter: 'blur(60px)',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute',
        top: '50%',
        right: 0,
        width: '384px',
        height: '384px',
        background: 'radial-gradient(circle, rgba(244, 114, 182, 0.3) 0%, transparent 70%)',
        borderRadius: '50%',
        filter: 'blur(60px)',
        transform: 'translateX(50%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: '50%',
        width: '384px',
        height: '384px',
        background: 'radial-gradient(circle, rgba(147, 197, 253, 0.3) 0%, transparent 70%)',
        borderRadius: '50%',
        filter: 'blur(60px)',
        transform: 'translate(-50%, 50%)',
        pointerEvents: 'none',
      }} />
    </>
  );

  if (isLoading) {
    return (
      <div className={className} style={backgroundStyle}>
        <DecorativeBackground />
        <div style={{
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              position: 'relative',
              width: '64px',
              height: '64px',
              margin: '0 auto 16px',
            }}>
              <div style={{
                position: 'absolute',
                inset: 0,
                border: '4px solid #e9d5ff',
                borderRadius: '50%',
              }} />
              <div style={{
                position: 'absolute',
                inset: 0,
                border: '4px solid transparent',
                borderTopColor: '#a855f7',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
              }} />
            </div>
            <p style={{ fontSize: '14px', color: '#6b7280' }}>✨ 加载中</p>
          </div>
        </div>
      </div>
    );
  }

  // 结果展示
  if (status === 'completed' && result) {
    return (
      <div className={className} style={backgroundStyle}>
        <DecorativeBackground />
        <div style={{
          position: 'relative',
          zIndex: 10,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
        }}>
        <div style={{ maxWidth: '420px', width: '100%' }}>
          {/* 结果卡片 - 可爱风格 */}
          <div style={{
            position: 'relative',
            background: 'linear-gradient(135deg, #fdf2f8 0%, #faf5ff 50%, #eff6ff 100%)',
            borderRadius: '32px',
            boxShadow: '0 25px 50px -12px rgba(168, 85, 247, 0.25), 0 0 0 1px rgba(168, 85, 247, 0.1)',
            overflow: 'hidden',
            padding: '40px 32px',
            textAlign: 'center',
          }}>
            {/* 装饰性星星 */}
            <div style={{ position: 'absolute', top: '20px', left: '20px', fontSize: '24px', opacity: 0.6 }}>✨</div>
            <div style={{ position: 'absolute', top: '40px', right: '30px', fontSize: '20px', opacity: 0.5 }}>⭐</div>
            <div style={{ position: 'absolute', bottom: '30px', left: '40px', fontSize: '18px', opacity: 0.4 }}>💫</div>
            <div style={{ position: 'absolute', bottom: '50px', right: '25px', fontSize: '22px', opacity: 0.5 }}>🌟</div>
            
            {/* Emoji 展示 */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ 
                display: 'inline-block',
                fontSize: '80px',
                animation: 'bounce-slow 2s ease-in-out infinite',
                filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.1))',
              }}>
                {result.imageType === 'emoji' ? result.image : '🎉'}
              </div>
            </div>

            {/* 标题 */}
            <h2 style={{
              fontSize: '32px',
              fontWeight: 800,
              background: 'linear-gradient(135deg, #9333ea 0%, #ec4899 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginBottom: '16px',
              lineHeight: 1.3,
            }}>
              {result.title}
            </h2>

            {/* 描述卡片 */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.8)',
              borderRadius: '20px',
              padding: '20px 24px',
              marginBottom: '28px',
              boxShadow: '0 4px 15px rgba(168, 85, 247, 0.1)',
              border: '2px dashed rgba(168, 85, 247, 0.2)',
            }}>
              <p style={{
                fontSize: '16px',
                color: '#6b7280',
                lineHeight: 1.7,
                margin: 0,
              }}>
                {result.description}
              </p>
            </div>

            {/* 可爱装饰线 */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginBottom: '24px',
            }}>
              <span style={{ width: '40px', height: '3px', background: 'linear-gradient(to right, #a855f7, transparent)', borderRadius: '999px' }}></span>
              <span style={{ fontSize: '16px' }}>💕</span>
              <span style={{ width: '40px', height: '3px', background: 'linear-gradient(to left, #ec4899, transparent)', borderRadius: '999px' }}></span>
            </div>

            {/* 重新测试按钮 */}
            <button
              onClick={handleReset}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '14px 32px',
                fontSize: '16px',
                fontWeight: 600,
                color: 'white',
                background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
                border: 'none',
                borderRadius: '9999px',
                cursor: 'pointer',
                boxShadow: '0 10px 25px -5px rgba(168, 85, 247, 0.4)',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05) translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 15px 35px -5px rgba(168, 85, 247, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1) translateY(0)';
                e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(168, 85, 247, 0.4)';
              }}
            >
              <span>🔄</span>
              <span>重新测试</span>
            </button>
          </div>
        </div>
        </div>
      </div>
    );
  }

  // 测试界面 - 时尚可爱设计
  return (
    <div className={className} style={backgroundStyle}>
      <DecorativeBackground />
      <div style={{
        position: 'relative',
        zIndex: 10,
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}>
      <div style={{ maxWidth: '512px', width: '100%', textAlign: 'center', userSelect: 'none' }}>
        {/* 标题区域 */}
        <div style={{ marginBottom: '48px' }}>
          <div style={{ 
            display: 'inline-block', 
            marginBottom: '16px',
            animation: 'bounce-slow 2s ease-in-out infinite',
          }}>
            <span style={{ fontSize: '56px' }}>🎲</span>
          </div>
          <h1 style={{
            fontSize: '48px',
            fontWeight: 900,
            marginBottom: '12px',
            background: 'linear-gradient(135deg, #9333ea 0%, #ec4899 50%, #3b82f6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            lineHeight: 1.2,
          }}>
            {gameTitle}
          </h1>
          {gameDescription && (
            <p style={{ 
              fontSize: '18px', 
              color: '#6b7280', 
              fontWeight: 500,
            }}>
              {gameDescription}
            </p>
          )}
        </div>

        {/* 长按按钮区域 */}
        <div style={{ marginBottom: '24px' }}>
          {/* 主按钮 */}
          <button
            onMouseDown={handlePressStart}
            onMouseLeave={handleMouseLeave}
            onTouchStart={handlePressStart}
            onTouchEnd={handlePressEnd}
            onTouchMove={handleTouchMove}
            onTouchCancel={handlePressEnd}
            onContextMenu={(e) => e.preventDefault()}
            onDragStart={(e) => e.preventDefault()}
            style={{
              display: 'block',
              margin: '0 auto',
              width: '200px',
              height: '200px',
              borderRadius: '50%',
              border: 'none',
              fontSize: '20px',
              fontWeight: 'bold',
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden',
              userSelect: 'none',
              WebkitTouchCallout: 'none',
              WebkitUserSelect: 'none',
              touchAction: 'none',
              transition: 'transform 0.3s ease',
              transform: status === 'pressing' ? 'scale(0.95)' : 'scale(1)',
              background: status === 'pressing' 
                ? `linear-gradient(to top, rgb(168, 85, 247) ${pressProgress}%, rgb(236, 72, 153) ${pressProgress}%)`
                : 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 25%, #db2777 50%, #f97316 75%, #059669 100%)',
              boxShadow: status === 'pressing' 
                ? 'inset 0 4px 12px rgba(0,0,0,0.3), 0 0 0 4px rgba(168, 85, 247, 0.5)'
                : '0 15px 35px -10px rgba(79, 70, 229, 0.6), 0 0 0 4px rgba(255,255,255,0.8)',
            }}
          >
            {/* 按钮内容 */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              pointerEvents: 'none',
            }}>
              {status === 'pressing' ? (
                <>
                  <span style={{ fontSize: '36px', fontWeight: 900, marginBottom: '4px' }}>{Math.round(pressProgress)}%</span>
                  <span style={{ fontSize: '14px', opacity: 0.8 }}>继续按住</span>
                </>
              ) : (
                <>
                  <span style={{ fontSize: '32px', marginBottom: '8px' }}>👆</span>
                  <span style={{ fontSize: '16px', fontWeight: 'bold', padding: '0 16px' }}>{buttonText}</span>
                </>
              )}
            </div>

            {/* 内部装饰圆环 */}
            {status === 'idle' && (
              <div style={{
                position: 'absolute',
                top: '16px',
                left: '16px',
                right: '16px',
                bottom: '16px',
                border: '2px solid rgba(255,255,255,0.3)',
                borderRadius: '50%',
              }}></div>
            )}
          </button>

          {/* 进度条 */}
          {status === 'pressing' && (
            <div style={{
              marginTop: '16px',
              marginLeft: 'auto',
              marginRight: 'auto',
              width: '192px',
              height: '8px',
              backgroundColor: '#e5e7eb',
              borderRadius: '9999px',
              overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                width: `${pressProgress}%`,
                background: 'linear-gradient(to right, #a855f7, #ec4899)',
                transition: 'width 0.1s ease',
              }} />
            </div>
          )}
        </div>

        {/* 底部提示 - 简洁可爱 */}
        <div style={{ marginTop: '24px' }}>
          {status === 'pressing' ? (
            <p style={{ 
              fontSize: '18px', 
              fontWeight: 500, 
              color: '#9333ea',
              animation: 'pulse 2s ease-in-out infinite',
            }}>
              ✨ 正在分析中...
            </p>
          ) : (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '8px',
            }}>
              <span style={{ 
                display: 'inline-block', 
                width: '6px', 
                height: '6px', 
                backgroundColor: '#a855f7', 
                borderRadius: '50%',
                animation: 'bounce 1s infinite',
              }} />
              <span style={{ 
                display: 'inline-block', 
                width: '6px', 
                height: '6px', 
                backgroundColor: '#ec4899', 
                borderRadius: '50%',
                animation: 'bounce 1s infinite 0.1s',
              }} />
              <span style={{ 
                display: 'inline-block', 
                width: '6px', 
                height: '6px', 
                backgroundColor: '#3b82f6', 
                borderRadius: '50%',
                animation: 'bounce 1s infinite 0.2s',
              }} />
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
};

// 添加CSS样式来支持触摸优化和动画
const touchOptimizationStyles = `
  @keyframes bounce-slow {
    0%, 100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-10px);
    }
  }
  
  @keyframes bounce {
    0%, 100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-4px);
    }
  }
  
  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }
  
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;

// 注入样式
if (typeof document !== 'undefined' && !document.getElementById('test-yourself-styles')) {
  const style = document.createElement('style');
  style.id = 'test-yourself-styles';
  style.textContent = touchOptimizationStyles;
  document.head.appendChild(style);
};

export default TestYourself;



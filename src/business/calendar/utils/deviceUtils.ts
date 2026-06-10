'use client';

/**
 * 检测是否为移动端设备
 */
export const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  // 检测屏幕宽度
  const isMobileWidth = window.innerWidth <= 768;
  
  // 检测触摸支持
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  // 检测用户代理
  const isMobileUserAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
  
  return isMobileWidth || (isTouchDevice && isMobileUserAgent);
};

/**
 * 检测是否支持拖拽
 */
export const isDragSupported = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  // 移动端禁用拖拽
  if (isMobileDevice()) return false;
  
  // 检测拖拽API支持
  return 'draggable' in document.createElement('div');
};

/**
 * 响应式Hook - 监听设备类型变化
 */
import { useState, useEffect } from 'react';

export const useDeviceType = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [dragSupported, setDragSupported] = useState(true);
  
  useEffect(() => {
    const checkDevice = () => {
      const mobile = isMobileDevice();
      setIsMobile(mobile);
      setDragSupported(isDragSupported());
    };
    
    checkDevice();
    window.addEventListener('resize', checkDevice);
    
    return () => window.removeEventListener('resize', checkDevice);
  }, []);
  
  return { isMobile, dragSupported };
}; 
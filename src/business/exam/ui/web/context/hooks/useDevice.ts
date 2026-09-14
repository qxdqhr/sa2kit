import { useState, useEffect } from 'react';

export const useDevice = () => {
  const [isMobile, setIsMobile] = useState(false);
  
  // 检测是否为移动设备
  useEffect(() => {
    const checkIfMobile = () => {
      if (typeof window !== 'undefined') {
        setIsMobile(window.innerWidth <= 768);
      }
    };
    
    checkIfMobile();
    
    // 安全地添加事件监听器
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', checkIfMobile);
    }
    
    return () => {
      // 安全地清理事件监听器
      try {
        if (typeof window !== 'undefined') {
          window.removeEventListener('resize', checkIfMobile);
        }
      } catch (error) {
        console.warn('清理useDevice resize监听器时出错:', error);
      }
    };
  }, []);
  
  return { isMobile };
}; 
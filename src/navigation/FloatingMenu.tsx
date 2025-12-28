'use client';

import React, { useState, useRef, useEffect, ReactNode } from 'react';
import { createPortal } from 'react-dom';

export interface FloatingMenuProps {
  /**
   * 触发按钮的内容
   */
  trigger: ReactNode;
  
  /**
   * 菜单内容
   */
  menu: ReactNode;
  
  /**
   * 初始位置
   */
  initialPosition?: { x: number; y: number };
  
  /**
   * 是否默认打开菜单
   */
  defaultOpen?: boolean;
  
  /**
   * 自定义类名
   */
  className?: string;
  
  /**
   * 菜单类名
   */
  menuClassName?: string;
  
  /**
   * 触发器类名
   */
  triggerClassName?: string;
  
  /**
   * z-index
   */
  zIndex?: number;
}

const FloatingMenu: React.FC<FloatingMenuProps> = ({
  trigger,
  menu,
  initialPosition = { x: 20, y: 20 },
  defaultOpen = false,
  className = '',
  menuClassName = '',
  triggerClassName = '',
  zIndex = 1000,
}) => {
  const [position, setPosition] = useState(initialPosition);
  const [isMenuOpen, setIsMenuOpen] = useState(defaultOpen);
  const [menuDirection, setMenuDirection] = useState<'left' | 'right'>('right');
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  // 添加一个标志，用于跟踪是否发生了拖动
  const [hasDragged, setHasDragged] = useState(false);
  // 添加一个计时器引用，用于区分点击和拖动
  const dragTimerRef = useRef<number | null>(null);
  // 添加一个引用，记录鼠标按下的初始位置
  const mouseDownPosRef = useRef<{ x: number, y: number } | null>(null);

  // 客户端挂载检查
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // 计算菜单方向
  useEffect(() => {
    if (!mounted || !containerRef.current) return;
    
    const updateMenuDirection = () => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      const windowWidth = window.innerWidth;
      const middlePoint = windowWidth / 2;
      
      // 如果悬浮窗在屏幕左半部分，菜单向右展开；否则向左展开
      setMenuDirection(rect.left < middlePoint ? 'right' : 'left');
    };
    
    updateMenuDirection();
    
    // 监听窗口大小变化和滚动事件
    window.addEventListener('resize', updateMenuDirection);
    window.addEventListener('scroll', updateMenuDirection);
    
    return () => {
      window.removeEventListener('resize', updateMenuDirection);
      window.removeEventListener('scroll', updateMenuDirection);
    };
  }, [mounted]);

  // 处理拖动开始
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    
    // 防止触发菜单点击
    e.stopPropagation();
    
    // 记录鼠标按下的初始位置
    mouseDownPosRef.current = { x: e.clientX, y: e.clientY };
    
    const rect = containerRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    
    // 重置拖动标志
    setHasDragged(false);
    
    // 设置拖动状态
    setIsDragging(true);
  };

  // 处理拖动过程
  useEffect(() => {
    if (!isDragging) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      // 检查是否移动了足够的距离来认为是拖动
      if (mouseDownPosRef.current) {
        const dx = Math.abs(e.clientX - mouseDownPosRef.current.x);
        const dy = Math.abs(e.clientY - mouseDownPosRef.current.y);
        
        // 如果移动距离超过阈值，标记为拖动
        if (dx > 3 || dy > 3) {
          setHasDragged(true);
        }
      }
      
      // 计算新位置并应用边界检查
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      
      setPosition({
        x: Math.min(Math.max(newX, 0), windowWidth - 50),
        y: Math.min(Math.max(newY, 0), windowHeight - 50)
      });
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
      
      // 重置鼠标按下位置
      mouseDownPosRef.current = null;
      
      // 设置一个短暂的延时，防止拖动后立即触发点击
      if (dragTimerRef.current) {
        window.clearTimeout(dragTimerRef.current);
      }
      
      dragTimerRef.current = window.setTimeout(() => {
        setHasDragged(false);
      }, 300); // 300ms 后重置拖动状态
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (dragTimerRef.current) {
        window.clearTimeout(dragTimerRef.current);
      }
    };
  }, []);

  // 切换菜单开关
  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // 如果刚刚拖动过，不触发菜单切换
    if (hasDragged) {
      return;
    }
    
    setIsMenuOpen(!isMenuOpen);
  };

  // 关闭菜单的点击外部处理
  useEffect(() => {
    if (!isMenuOpen) return;
    
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  // 窗口大小变化时的边界检查
  useEffect(() => {
    if (!mounted) return;
    
    const checkBoundaries = () => {
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      
      // 确保悬浮窗不会被拖出屏幕
      setPosition(prev => {
        const newX = Math.min(Math.max(prev.x, 0), windowWidth - 50);
        const newY = Math.min(Math.max(prev.y, 0), windowHeight - 50);
        
        // 只有在实际需要调整时才更新位置
        if (newX !== prev.x || newY !== prev.y) {
          return { x: newX, y: newY };
        }
        return prev;
      });
    };
    
    // 只在窗口大小变化时检查边界
    window.addEventListener('resize', checkBoundaries);
    
    return () => {
      window.removeEventListener('resize', checkBoundaries);
    };
  }, [mounted]);

  if (!mounted) return null;

  return createPortal(
    <div
      ref={containerRef}
      className={`fixed select-none box-border ${className}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex,
      }}
    >
      {/* 触发器按钮 */}
      <div 
        className={`
          flex items-center justify-center 
          w-12 h-12 md:w-12 md:h-12 
          bg-white rounded-full 
          shadow-md hover:shadow-lg 
          cursor-grab active:cursor-grabbing 
          transition-all duration-200 
          hover:scale-105 active:scale-95
          ${triggerClassName}
        `}
        onMouseDown={handleMouseDown}
        onClick={toggleMenu}
      >
        {trigger}
      </div>
      
      {/* 菜单内容 */}
      {isMenuOpen && (
        <div 
          className={`
            absolute top-0
            bg-white rounded-lg shadow-xl 
            p-3 min-w-[200px] md:min-w-[200px] max-w-[300px]
            z-[1000] 
            transition-all duration-200
            ${isMenuOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}
            ${menuDirection === 'left' ? 'right-[calc(100%+10px)]' : 'left-[calc(100%+10px)]'}
            ${menuClassName}
          `}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onMouseUp={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          onPointerUp={(e) => e.stopPropagation()}
        >
          {menu}
        </div>
      )}
    </div>,
    document.body
  );
};

export default FloatingMenu;
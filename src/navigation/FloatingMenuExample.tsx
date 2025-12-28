'use client';

import React, { useState, useEffect } from 'react';
import FloatingMenu from './FloatingMenu';

export const FloatingMenuExample: React.FC = () => {
  const [windowWidth, setWindowWidth] = useState(0);
  
  useEffect(() => {
    setWindowWidth(window.innerWidth);
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const menuItems = [
    { id: 1, label: '首页', icon: '🏠' },
    { id: 2, label: '设置', icon: '⚙️' },
    { id: 3, label: '消息', icon: '📩' },
    { id: 4, label: '帮助', icon: '❓' },
    { id: 5, label: '退出', icon: '🚪' },
  ];
  
  const handleMenuItemClick = (id: number) => {
    console.log(`点击了菜单项: ${id}`);
  };
  
  return (
    <div className="w-full h-screen bg-gray-100 relative p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm p-8 mt-12">
        <h1 className="text-3xl font-bold mb-4 text-gray-900">悬浮菜单示例</h1>
        <p className="text-gray-600 leading-relaxed mb-6">
          这是一个可拖拽的悬浮菜单组件示例。你可以尝试拖动下方的 <span className="font-bold text-blue-600">蓝色按钮</span> 到处移动。
        </p>
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
          <p className="text-sm text-blue-700">
            <strong>智能定位：</strong> 菜单会根据按钮在屏幕上的位置自动调整弹出方向（向左或向右）。
          </p>
        </div>
      </div>
      
      <FloatingMenu
        trigger={
          <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg cursor-pointer">
            <span className="text-xl">➕</span>
          </div>
        }
        menu={
          <div className="w-48 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-900">快捷菜单</h3>
            </div>
            <ul className="py-1">
              {menuItems.map(item => (
                <li 
                  key={item.id} 
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-blue-50 text-gray-700 hover:text-blue-600 cursor-pointer transition-colors text-sm"
                  onClick={() => handleMenuItemClick(item.id)}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </li>
              ))}
            </ul>
          </div>
        }
        initialPosition={{ x: 100, y: 100 }}
      />
      
      {windowWidth > 0 && (
        <FloatingMenu
          trigger={
            <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center text-white shadow-lg cursor-pointer">
              <span className="text-xl">🔍</span>
            </div>
          }
          menu={
            <div className="w-64 bg-white rounded-xl shadow-xl border border-gray-100 p-4">
              <h3 className="text-sm font-bold text-gray-900 mb-3">快速搜索</h3>
              <div className="space-y-3">
                <input 
                  type="text" 
                  placeholder="输入关键字..." 
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                />
                <button className="w-full bg-purple-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors">
                  搜索
                </button>
              </div>
            </div>
          }
          initialPosition={{ x: windowWidth - 100, y: 100 }}
        />
      )}
    </div>
  );
};

export default FloatingMenuExample;


'use client';

/**
 * 调试页面 - 简化版测试按钮
 */

import React, { useState } from 'react';

export default function TestDebugPage() {
  const [pressed, setPressed] = useState(false);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8 p-8">
      <h1 className="text-4xl font-bold">按钮调试页面</h1>
      
      {/* 测试按钮1: 纯色背景 */}
      <button
        className="w-64 h-64 rounded-full bg-red-500 text-white font-bold text-2xl shadow-2xl hover:scale-110 transition-all"
        onClick={() => alert('红色按钮被点击！')}
      >
        红色测试按钮
      </button>

      {/* 测试按钮2: 渐变背景 */}
      <button
        className="w-64 h-64 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold text-2xl shadow-2xl hover:scale-110 transition-all"
        style={{
          boxShadow: '0 20px 60px rgba(79, 70, 229, 0.8), 0 0 0 6px rgba(255,255,255,1)',
        }}
        onClick={() => alert('渐变按钮被点击！')}
      >
        渐变测试按钮
      </button>

      {/* 测试按钮3: 长按测试 */}
      <button
        className="w-64 h-64 rounded-full bg-green-500 text-white font-bold text-2xl shadow-2xl hover:scale-110 transition-all"
        onMouseDown={() => setPressed(true)}
        onMouseUp={() => setPressed(false)}
        onMouseLeave={() => setPressed(false)}
      >
        {pressed ? '按住中...' : '长按测试'}
      </button>

      <p className="text-gray-600">
        如果你能看到这些按钮，说明渲染正常
      </p>
    </div>
  );
}




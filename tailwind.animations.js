/**
 * SA2Kit Tailwind 动画配置预设
 * 可选配置：用户可以在自己的 tailwind.config.js 中扩展这些动画
 * 
 * 使用方法：
 * // tailwind.config.js
 * const sa2kitAnimations = require('@qhr123/sa2kit/tailwind.animations');
 * 
 * module.exports = {
 *   theme: {
 *     extend: {
 *       ...sa2kitAnimations
 *     }
 *   }
 * }
 */

module.exports = {
  keyframes: {
    fadeIn: {
      '0%': { opacity: '0' },
      '100%': { opacity: '1' },
    },
    slideUp: {
      '0%': { opacity: '0', transform: 'translateY(20px)' },
      '100%': { opacity: '1', transform: 'translateY(0)' },
    },
  },
  animation: {
    'fade-in': 'fadeIn 0.3s ease-in-out forwards',
    'slide-up': 'slideUp 0.3s ease-out forwards',
  },
};


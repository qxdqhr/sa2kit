/**
 * 基础使用示例
 * Basic Usage Example
 */

import React from 'react';
import { logger, stringUtils, arrayUtils, useLocalStorage } from '@react-utils-kit/core';

// 1. Logger 示例
logger.info('Application started');
logger.debug('Debug info', { timestamp: Date.now() });

const apiLogger = logger.createChild('API');
apiLogger.info('Request completed');

// 2. String Utils 示例
const longText = 'This is a very long text that needs to be truncated';
const truncated = stringUtils.truncate(longText, 30);
console.log(truncated); // 'This is a very long text t...'

const name = stringUtils.capitalize('john doe');
console.log(name); // 'John doe'

// 3. Array Utils 示例
const numbers = [1, 2, 2, 3, 3, 4, 5];
const unique = arrayUtils.unique(numbers);
console.log(unique); // [1, 2, 3, 4, 5]

const items = [
  { category: 'fruit', name: 'apple' },
  { category: 'fruit', name: 'banana' },
  { category: 'vegetable', name: 'carrot' },
];
const grouped = arrayUtils.groupBy(items, 'category');
console.log(grouped);

// 4. React Hook 示例
function ThemeToggle() {
  const [theme, setTheme, , loading] = useLocalStorage<'light' | 'dark'>('theme', 'light');

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ background: theme === 'dark' ? '#333' : '#fff' }}>
      <h1>Current Theme: {theme}</h1>
      <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
        Toggle Theme
      </button>
    </div>
  );
}

export default ThemeToggle;


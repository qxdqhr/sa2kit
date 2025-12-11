'use client';

/**
 * 测测你是什么 - 示例页面
 * Test Yourself Game - Example Page
 */

import { TestYourself } from 'sa2kit/testYourself';
import type { TestConfig, TestResult } from 'sa2kit/testYourself';

export default function TestYourselfPage() {
  const config: TestConfig = {
    gameTitle: '测测你是什么',
    gameDescription: '✨ 长按发现专属结果',
    buttonText: '按住',
    longPressDuration: 2000,
    enableIPFetch: false,
    results: [],
  };

  const handleResult = (result: TestResult) => {
    console.log('✅ 测试结果:', result);
  };

  return (
    <TestYourself 
      config={config}
      onResult={handleResult}
    />
  );
}



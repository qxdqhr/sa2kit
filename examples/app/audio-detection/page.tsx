'use client';

/**
 * 音频检测模块使用示例
 * Audio Detection Module Usage Example
 */

import React, { useState } from 'react';
import { 
  AudioDetectionDisplay, 
  PianoKeyboard, 
  useAudioDetection,
} from 'sa2kit/audioDetection';

/**
 * 示例1: 基础使用 - 使用预构建组件
 */
function BasicExample() {
  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-4">基础示例</h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        使用预构建的音频检测组件
      </p>
      <AudioDetectionDisplay
        autoStart={false}
        minVolume={0.01}
        minConfidence={0.7}
        showDebugInfo={false}
        startButtonText="开始检测"
        stopButtonText="停止检测"
      />
    </div>
  );
}

/**
 * 示例2: 自定义 UI - 使用 Hook 和钢琴键盘
 */
function CustomUIExample() {
  const { result, isDetecting, error, start, stop } = useAudioDetection({
    autoStart: false,
    minVolume: 0.01,
    minConfidence: 0.7,
    updateInterval: 50,
  });

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-4">自定义 UI 示例</h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        使用 Hook 和钢琴键盘可视化
      </p>
      
      {/* 控制按钮 */}
      <div className="mb-6">
        <button
          onClick={isDetecting ? stop : start}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            isDetecting
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
        >
          {isDetecting ? '🔴 停止检测' : '🎵 开始检测'}
        </button>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="p-4 mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-700 dark:text-red-400">错误: {error.message}</p>
        </div>
      )}

      {/* 钢琴键盘可视化 */}
      <div className="mb-6">
        <PianoKeyboard
          activeNotes={result?.notes || []}
          startOctave={2}
          endOctave={6}
          showNoteNames={true}
        />
      </div>

      {/* 检测信息 */}
      {result && result.isDetecting && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
            <h3 className="text-xl font-bold mb-4">检测到的音符</h3>
            {result.notes.length > 0 ? (
              <ul className="space-y-2">
                {result.notes.map((note, index) => (
                  <li key={index} className="flex justify-between items-center">
                    <strong className="text-lg">{note.name}</strong>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {note.frequency.toFixed(2)} Hz
                      <span className="ml-2">({(note.confidence * 100).toFixed(0)}%)</span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">未检测到音符</p>
            )}
          </div>

          {result.chord && (
            <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
              <h3 className="text-xl font-bold mb-4">识别的和弦</h3>
              <p className="text-4xl font-bold text-green-600 dark:text-green-400 mb-4">
                {result.chord.name}
              </p>
              <div className="space-y-2 text-sm">
                <p><span className="font-medium">类型:</span> {result.chord.type}</p>
                <p><span className="font-medium">置信度:</span> {(result.chord.confidence * 100).toFixed(0)}%</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * 示例3: 高级使用 - 完全自定义
 */
function AdvancedExample() {
  const [config, setConfig] = useState({
    minVolume: 0.01,
    minConfidence: 0.7,
    smoothing: 0.8,
    fftSize: 4096,
  });

  const { result, isDetecting, state, start, stop } = useAudioDetection({
    ...config,
    autoStart: false,
  });

  const handleConfigChange = (key: string, value: number) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">高级配置示例</h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        完全自定义的音频检测配置
      </p>

      {/* 配置面板 */}
      <div className="p-6 bg-gray-50 dark:bg-gray-900/50 rounded-lg mb-6">
        <h3 className="text-lg font-bold mb-4">检测参数</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              最小音量: {config.minVolume.toFixed(3)}
            </label>
            <input
              type="range"
              min="0.001"
              max="0.1"
              step="0.001"
              value={config.minVolume}
              onChange={(e) => handleConfigChange('minVolume', parseFloat(e.target.value))}
              disabled={isDetecting}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              最小置信度: {config.minConfidence.toFixed(2)}
            </label>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.05"
              value={config.minConfidence}
              onChange={(e) => handleConfigChange('minConfidence', parseFloat(e.target.value))}
              disabled={isDetecting}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              平滑系数: {config.smoothing.toFixed(2)}
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={config.smoothing}
              onChange={(e) => handleConfigChange('smoothing', parseFloat(e.target.value))}
              disabled={isDetecting}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              FFT 大小: {config.fftSize}
            </label>
            <select
              value={config.fftSize}
              onChange={(e) => handleConfigChange('fftSize', parseInt(e.target.value))}
              disabled={isDetecting}
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-800"
            >
              <option value="2048">2048</option>
              <option value="4096">4096</option>
              <option value="8192">8192</option>
              <option value="16384">16384</option>
            </select>
          </div>
        </div>
      </div>

      {/* 控制和状态 */}
      <div className="mb-6 flex items-center gap-4">
        <button
          onClick={isDetecting ? stop : start}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            isDetecting
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
        >
          {isDetecting ? '停止检测' : '开始检测'}
        </button>
        <span className="text-sm">
          状态: <strong>{state}</strong>
        </span>
      </div>

      {/* 钢琴键盘 */}
      <div className="mb-6">
        <PianoKeyboard
          activeNotes={result?.notes || []}
          startOctave={1}
          endOctave={7}
        />
      </div>

      {/* 详细信息 */}
      {result && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
            <h3 className="text-lg font-bold mb-4">音符详情</h3>
            {result.notes.length > 0 ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">音符</th>
                    <th className="text-left py-2">频率 (Hz)</th>
                    <th className="text-left py-2">MIDI</th>
                    <th className="text-left py-2">置信度</th>
                  </tr>
                </thead>
                <tbody>
                  {result.notes.map((note, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-2"><strong>{note.name}</strong></td>
                      <td className="py-2">{note.frequency.toFixed(2)}</td>
                      <td className="py-2">{note.midi}</td>
                      <td className="py-2">{(note.confidence * 100).toFixed(0)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-gray-500">未检测到音符</p>
            )}
          </div>

          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
            <h3 className="text-lg font-bold mb-4">和弦信息</h3>
            {result.chord ? (
              <div>
                <p className="text-4xl font-bold mb-4">{result.chord.name}</p>
                <div className="space-y-2 text-sm">
                  <p><strong>类型:</strong> {result.chord.type}</p>
                  <p><strong>根音:</strong> {result.chord.root}</p>
                  <p><strong>组成音符:</strong> {result.chord.notes.map(n => n.name).join(', ')}</p>
                  <p><strong>置信度:</strong> {(result.chord.confidence * 100).toFixed(0)}%</p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">未检测到和弦</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * 主示例应用
 */
export default function AudioDetectionPage() {
  const [activeExample, setActiveExample] = useState<'basic' | 'custom' | 'advanced'>('basic');

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto">
        {/* 头部 */}
        <div className="p-8 pb-0">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            音频检测示例
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            实时音频检测、音符识别和和弦分析
          </p>
        </div>

        {/* 标签页切换 */}
        <div className="px-8 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveExample('basic')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeExample === 'basic'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              基础示例
            </button>
            <button
              onClick={() => setActiveExample('custom')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeExample === 'custom'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              自定义UI
            </button>
            <button
              onClick={() => setActiveExample('advanced')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeExample === 'advanced'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              高级配置
            </button>
          </div>
        </div>

        {/* 内容区域 */}
        <div className="bg-white dark:bg-gray-800">
          {activeExample === 'basic' && <BasicExample />}
          {activeExample === 'custom' && <CustomUIExample />}
          {activeExample === 'advanced' && <AdvancedExample />}
        </div>
      </div>
    </div>
  );
}




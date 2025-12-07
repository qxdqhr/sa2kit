/**
 * 音频检测模块使用示例
 * Audio Detection Module Usage Example
 */

import React, { useState } from 'react';
import { 
  AudioDetectionDisplay, 
  PianoKeyboard, 
  useAudioDetection,
  audioDetectionStyles,
  pianoKeyboardStyles,
} from '../../../src/audioDetection';

/**
 * 示例1: 基础使用 - 使用预构建组件
 * Example 1: Basic Usage - Using Pre-built Component
 */
export function BasicExample() {
  return (
    <div>
      <style>{audioDetectionStyles}</style>
      <h1>电子琴音频识别</h1>
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
 * Example 2: Custom UI - Using Hook with Piano Keyboard
 */
export function CustomUIExample() {
  const { result, isDetecting, error, start, stop } = useAudioDetection({
    autoStart: false,
    minVolume: 0.01,
    minConfidence: 0.7,
    updateInterval: 50, // 更快的更新频率
  });

  return (
    <div style={{ padding: '20px' }}>
      <style>{audioDetectionStyles + pianoKeyboardStyles}</style>
      
      <h1>电子琴音高可视化</h1>
      
      {/* 控制按钮 */}
      <div style={{ marginBottom: '20px' }}>
        <button onClick={isDetecting ? stop : start}>
          {isDetecting ? '🔴 停止检测' : '🎵 开始检测'}
        </button>
      </div>

      {/* 错误提示 */}
      {error && (
        <div style={{ color: 'red', marginBottom: '20px' }}>
          错误: {error.message}
        </div>
      )}

      {/* 钢琴键盘可视化 */}
      <PianoKeyboard
        activeNotes={result?.notes || []}
        startOctave={2}
        endOctave={6}
        showNoteNames={true}
      />

      {/* 检测信息 */}
      {result && result.isDetecting && (
        <div style={{ marginTop: '20px' }}>
          <h3>检测到的音符:</h3>
          <ul>
            {result.notes.map((note, index) => (
              <li key={index}>
                <strong>{note.name}</strong> - {note.frequency.toFixed(2)} Hz
                (置信度: {(note.confidence * 100).toFixed(0)}%)
              </li>
            ))}
          </ul>

          {result.chord && (
            <div style={{ marginTop: '20px' }}>
              <h3>识别的和弦:</h3>
              <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#28a745' }}>
                {result.chord.name}
              </p>
              <p>类型: {result.chord.type}</p>
              <p>置信度: {(result.chord.confidence * 100).toFixed(0)}%</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * 示例3: 高级使用 - 完全自定义
 * Example 3: Advanced Usage - Fully Customized
 */
export function AdvancedExample() {
  const [config, setConfig] = useState({
    minVolume: 0.01,
    minConfidence: 0.7,
    smoothing: 0.8,
    fftSize: 4096,
  });

  const { result, isDetecting, state, start, stop, getDetector } = useAudioDetection({
    ...config,
    autoStart: false,
  });

  const handleConfigChange = (key: string, value: number) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <style>{audioDetectionStyles + pianoKeyboardStyles}</style>
      
      <h1>高级音频检测配置</h1>

      {/* 配置面板 */}
      <div style={{ 
        padding: '20px', 
        backgroundColor: '#f5f5f5', 
        borderRadius: '8px',
        marginBottom: '20px' 
      }}>
        <h3>检测参数</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
          <div>
            <label>
              最小音量: {config.minVolume.toFixed(3)}
              <input
                type="range"
                min="0.001"
                max="0.1"
                step="0.001"
                value={config.minVolume}
                onChange={(e) => handleConfigChange('minVolume', parseFloat(e.target.value))}
                disabled={isDetecting}
              />
            </label>
          </div>

          <div>
            <label>
              最小置信度: {config.minConfidence.toFixed(2)}
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.05"
                value={config.minConfidence}
                onChange={(e) => handleConfigChange('minConfidence', parseFloat(e.target.value))}
                disabled={isDetecting}
              />
            </label>
          </div>

          <div>
            <label>
              平滑系数: {config.smoothing.toFixed(2)}
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={config.smoothing}
                onChange={(e) => handleConfigChange('smoothing', parseFloat(e.target.value))}
                disabled={isDetecting}
              />
            </label>
          </div>

          <div>
            <label>
              FFT 大小: {config.fftSize}
              <select
                value={config.fftSize}
                onChange={(e) => handleConfigChange('fftSize', parseInt(e.target.value))}
                disabled={isDetecting}
              >
                <option value="2048">2048</option>
                <option value="4096">4096</option>
                <option value="8192">8192</option>
                <option value="16384">16384</option>
              </select>
            </label>
          </div>
        </div>
      </div>

      {/* 控制和状态 */}
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={isDetecting ? stop : start}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            backgroundColor: isDetecting ? '#dc3545' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          {isDetecting ? '停止检测' : '开始检测'}
        </button>
        <span style={{ marginLeft: '16px', fontSize: '14px' }}>
          状态: <strong>{state}</strong>
        </span>
      </div>

      {/* 钢琴键盘 */}
      <PianoKeyboard
        activeNotes={result?.notes || []}
        startOctave={1}
        endOctave={7}
      />

      {/* 详细信息 */}
      {result && (
        <div style={{ 
          marginTop: '20px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '20px'
        }}>
          <div style={{ 
            padding: '16px', 
            backgroundColor: '#fff', 
            borderRadius: '8px',
            border: '1px solid #ddd'
          }}>
            <h3>音符详情</h3>
            {result.notes.length > 0 ? (
              <table style={{ width: '100%', fontSize: '14px' }}>
                <thead>
                  <tr>
                    <th>音符</th>
                    <th>频率 (Hz)</th>
                    <th>MIDI</th>
                    <th>置信度</th>
                  </tr>
                </thead>
                <tbody>
                  {result.notes.map((note, index) => (
                    <tr key={index}>
                      <td><strong>{note.name}</strong></td>
                      <td>{note.frequency.toFixed(2)}</td>
                      <td>{note.midi}</td>
                      <td>{(note.confidence * 100).toFixed(0)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p style={{ color: '#999' }}>未检测到音符</p>
            )}
          </div>

          <div style={{ 
            padding: '16px', 
            backgroundColor: '#fff', 
            borderRadius: '8px',
            border: '1px solid #ddd'
          }}>
            <h3>和弦信息</h3>
            {result.chord ? (
              <div>
                <p style={{ fontSize: '32px', fontWeight: 'bold', margin: '12px 0' }}>
                  {result.chord.name}
                </p>
                <p><strong>类型:</strong> {result.chord.type}</p>
                <p><strong>根音:</strong> {result.chord.root}</p>
                <p><strong>组成音符:</strong> {result.chord.notes.map(n => n.name).join(', ')}</p>
                <p><strong>置信度:</strong> {(result.chord.confidence * 100).toFixed(0)}%</p>
              </div>
            ) : (
              <p style={{ color: '#999' }}>未检测到和弦</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * 主示例应用
 * Main Example App
 */
export default function AudioDetectionExamples() {
  const [activeExample, setActiveExample] = useState<'basic' | 'custom' | 'advanced'>('basic');

  return (
    <div>
      <div style={{ 
        padding: '16px', 
        backgroundColor: '#f8f9fa', 
        borderBottom: '1px solid #ddd',
        display: 'flex',
        gap: '12px'
      }}>
        <button onClick={() => setActiveExample('basic')}>基础示例</button>
        <button onClick={() => setActiveExample('custom')}>自定义UI</button>
        <button onClick={() => setActiveExample('advanced')}>高级配置</button>
      </div>

      <div>
        {activeExample === 'basic' && <BasicExample />}
        {activeExample === 'custom' && <CustomUIExample />}
        {activeExample === 'advanced' && <AdvancedExample />}
      </div>
    </div>
  );
}


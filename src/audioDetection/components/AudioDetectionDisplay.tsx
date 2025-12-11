/**
 * 音频检测组件
 * Audio Detection Component
 * 
 * 显示实时音频检测结果的React组件
 * React component for displaying real-time audio detection results
 */

import React from 'react';
import { useAudioDetection, type UseAudioDetectionOptions } from '../hooks/useAudioDetection';
import type { NoteInfo, ChordInfo } from '../types';

export interface AudioDetectionDisplayProps extends UseAudioDetectionOptions {
  /** 自定义类名 */
  className?: string;
  /** 是否显示调试信息 */
  showDebugInfo?: boolean;
  /** 自定义渲染音符 */
  renderNote?: (note: NoteInfo) => React.ReactNode;
  /** 自定义渲染和弦 */
  renderChord?: (chord: ChordInfo) => React.ReactNode;
  /** 开始按钮文本 */
  startButtonText?: string;
  /** 停止按钮文本 */
  stopButtonText?: string;
}

/**
 * 音频检测显示组件
 */
export const AudioDetectionDisplay: React.FC<AudioDetectionDisplayProps> = ({
  className = '',
  showDebugInfo = false,
  renderNote,
  renderChord,
  startButtonText = '开始检测',
  stopButtonText = '停止检测',
  ...options
}) => {
  const { result, state, isDetecting, error, start, stop } = useAudioDetection(options);

  const handleToggle = async () => {
    if (isDetecting) {
      stop();
    } else {
      try {
        await start();
      } catch (err) {
        console.error('启动失败:', err);
      }
    }
  };

  return (
    <div className={`audio-detection-display ${className}`}>
      {/* 控制按钮 */}
      <div className="audio-detection-controls">
        <button
          onClick={handleToggle}
          disabled={state === 'initializing'}
          className={`audio-detection-button ${isDetecting ? 'active' : ''}`}
        >
          {state === 'initializing' ? '初始化中...' : isDetecting ? stopButtonText : startButtonText}
        </button>
        
        <div className={`audio-detection-status status-${state}`}>
          状态: {getStateLabel(state)}
        </div>
      </div>

      {/* 错误信息 */}
      {error && (
        <div className="audio-detection-error">
          <strong>错误:</strong> {error.message}
        </div>
      )}

      {/* 检测结果 */}
      {result && result.isDetecting && (
        <div className="audio-detection-result">
          {/* 音符显示 */}
          {result.notes.length > 0 && (
            <div className="audio-detection-notes">
              <h3>检测到的音符:</h3>
              <div className="notes-grid">
                {result.notes.map((note, index) => (
                  <div key={index} className="note-item">
                    {renderNote ? renderNote(note) : <DefaultNoteDisplay note={note} />}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 和弦显示 */}
          {result.chord && (
            <div className="audio-detection-chord">
              <h3>识别的和弦:</h3>
              {renderChord ? renderChord(result.chord) : <DefaultChordDisplay chord={result.chord} />}
            </div>
          )}

          {/* 调试信息 */}
          {showDebugInfo && (
            <div className="audio-detection-debug">
              <h4>调试信息:</h4>
              <pre>{JSON.stringify(result, null, 2)}</pre>
            </div>
          )}
        </div>
      )}

      {/* 无检测结果时的提示 */}
      {isDetecting && (!result || !result.isDetecting) && (
        <div className="audio-detection-waiting">
          正在监听... 请弹奏电子琴
        </div>
      )}
    </div>
  );
};

/**
 * 默认音符显示
 */
const DefaultNoteDisplay: React.FC<{ note: NoteInfo }> = ({ note }) => (
  <div className="default-note-display">
    <div className="note-name">{note.name}</div>
    <div className="note-frequency">{note.frequency.toFixed(2)} Hz</div>
    <div className="note-confidence">
      置信度: {(note.confidence * 100).toFixed(0)}%
    </div>
  </div>
);

/**
 * 默认和弦显示
 */
const DefaultChordDisplay: React.FC<{ chord: ChordInfo }> = ({ chord }) => (
  <div className="default-chord-display">
    <div className="chord-name">{chord.name}</div>
    <div className="chord-type">类型: {chord.type}</div>
    <div className="chord-notes">
      音符: {chord.notes.map(n => n.name).join(', ')}
    </div>
    <div className="chord-confidence">
      置信度: {(chord.confidence * 100).toFixed(0)}%
    </div>
  </div>
);

/**
 * 获取状态标签
 */
function getStateLabel(state: string): string {
  const labels: { [key: string]: string } = {
    idle: '空闲',
    initializing: '初始化中',
    active: '运行中',
    error: '错误',
    stopped: '已停止',
  };
  return labels[state] || state;
}

/**
 * 默认样式（可以通过CSS覆盖）
 */
export const audioDetectionStyles = `
.audio-detection-display {
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.audio-detection-controls {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 20px;
}

.audio-detection-button {
  padding: 10px 20px;
  font-size: 16px;
  border: none;
  border-radius: 6px;
  background-color: #007bff;
  color: white;
  cursor: pointer;
  transition: background-color 0.3s;
}

.audio-detection-button:hover {
  background-color: #0056b3;
}

.audio-detection-button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.audio-detection-button.active {
  background-color: #dc3545;
}

.audio-detection-button.active:hover {
  background-color: #c82333;
}

.audio-detection-status {
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 14px;
}

.status-idle { background-color: #e7f3ff; color: #004085; }
.status-initializing { background-color: #fff3cd; color: #856404; }
.status-active { background-color: #d4edda; color: #155724; }
.status-error { background-color: #f8d7da; color: #721c24; }
.status-stopped { background-color: #e2e3e5; color: #383d41; }

.audio-detection-error {
  padding: 12px;
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
  color: #721c24;
  margin-bottom: 16px;
}

.audio-detection-result {
  margin-top: 20px;
}

.audio-detection-notes h3,
.audio-detection-chord h3 {
  margin-bottom: 12px;
  font-size: 18px;
}

.notes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 12px;
}

.note-item {
  padding: 12px;
  border: 2px solid #007bff;
  border-radius: 6px;
  background-color: #f8f9fa;
}

.default-note-display {
  text-align: center;
}

.note-name {
  font-size: 24px;
  font-weight: bold;
  color: #007bff;
  margin-bottom: 4px;
}

.note-frequency {
  font-size: 14px;
  color: #666;
  margin-bottom: 4px;
}

.note-confidence {
  font-size: 12px;
  color: #999;
}

.audio-detection-chord {
  margin-top: 20px;
  padding: 16px;
  border: 2px solid #28a745;
  border-radius: 8px;
  background-color: #f8f9fa;
}

.default-chord-display {
  text-align: center;
}

.chord-name {
  font-size: 32px;
  font-weight: bold;
  color: #28a745;
  margin-bottom: 8px;
}

.chord-type,
.chord-notes,
.chord-confidence {
  margin-bottom: 4px;
  color: #666;
}

.audio-detection-waiting {
  text-align: center;
  padding: 40px;
  color: #666;
  font-size: 18px;
}

.audio-detection-debug {
  margin-top: 20px;
  padding: 12px;
  background-color: #f4f4f4;
  border-radius: 4px;
}

.audio-detection-debug pre {
  margin: 8px 0 0 0;
  font-size: 12px;
  overflow-x: auto;
}
`;















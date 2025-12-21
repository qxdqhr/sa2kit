/**
 * 钢琴键盘可视化组件
 * Piano Keyboard Visualization Component
 */

import React, { useMemo } from 'react';
import type { NoteInfo } from '../types';

export interface PianoKeyboardProps {
  /** 当前激活的音符 */
  activeNotes?: NoteInfo[];
  /** 起始八度 (默认: 2) */
  startOctave?: number;
  /** 结束八度 (默认: 6) */
  endOctave?: number;
  /** 自定义类名 */
  className?: string;
  /** 是否显示音符名称 */
  showNoteNames?: boolean;
}

interface PianoKey {
  noteName: string;
  octave: number;
  midi: number;
  isBlack: boolean;
  isActive: boolean;
}

/**
 * 钢琴键盘可视化
 */
export const PianoKeyboard: React.FC<PianoKeyboardProps> = ({
  activeNotes = [],
  startOctave = 2,
  endOctave = 6,
  className = '',
  showNoteNames = true,
}) => {
  // 生成钢琴键
  const keys = useMemo(() => {
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const blackKeys = new Set(['C#', 'D#', 'F#', 'G#', 'A#']);
    const allKeys: PianoKey[] = [];

    for (let octave = startOctave; octave <= endOctave; octave++) {
      for (const noteName of noteNames) {
        const midi = (octave + 1) * 12 + noteNames.indexOf(noteName);
        const isActive = activeNotes.some(note => note.midi === midi);
        
        allKeys.push({
          noteName,
          octave,
          midi,
          isBlack: blackKeys.has(noteName),
          isActive,
        });
      }
    }

    return allKeys;
  }, [startOctave, endOctave, activeNotes]);

  // 分离白键和黑键
  const whiteKeys = keys.filter(k => !k.isBlack);
  const blackKeys = keys.filter(k => k.isBlack);

  return (
    <div className={`piano-keyboard ${className}`}>
      <div className="piano-keys-container">
        {/* 白键 */}
        <div className="white-keys">
          {whiteKeys.map((key, index) => (
            <div
              key={`white-${key.midi}`}
              className={`piano-key white-key ${key.isActive ? 'active' : ''}`}
              title={`${key.noteName}${key.octave}`}
            >
              {showNoteNames && (
                <span className="key-label">{key.noteName}{key.octave}</span>
              )}
            </div>
          ))}
        </div>

        {/* 黑键 */}
        <div className="black-keys">
          {blackKeys.map((key) => {
            // 计算黑键的位置
            const whiteKeyIndex = getWhiteKeyIndexBeforeBlack(key.noteName);
            const octaveOffset = (key.octave - startOctave) * 7; // 每个八度有7个白键
            const position = whiteKeyIndex + octaveOffset;

            return (
              <div
                key={`black-${key.midi}`}
                className={`piano-key black-key ${key.isActive ? 'active' : ''}`}
                style={{ left: `${(position + 0.7) * (100 / whiteKeys.length)}%` }}
                title={`${key.noteName}${key.octave}`}
              >
                {showNoteNames && (
                  <span className="key-label">{key.noteName}{key.octave}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/**
 * 获取黑键之前的白键索引
 */
function getWhiteKeyIndexBeforeBlack(noteName: string): number {
  const map: { [key: string]: number } = {
    'C#': 0,
    'D#': 1,
    'F#': 3,
    'G#': 4,
    'A#': 5,
  };
  return map[noteName] || 0;
}

/**
 * 钢琴键盘样式
 */
export const pianoKeyboardStyles = `
.piano-keyboard {
  width: 100%;
  padding: 20px;
  background-color: #2c3e50;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
}

.piano-keys-container {
  position: relative;
  width: 100%;
  height: 200px;
}

.white-keys {
  display: flex;
  height: 100%;
  gap: 2px;
}

.piano-key {
  position: relative;
  border: 1px solid #000;
  cursor: pointer;
  transition: all 0.15s ease;
}

.white-key {
  flex: 1;
  background: linear-gradient(to bottom, #ffffff 0%, #f0f0f0 100%);
  border-radius: 0 0 4px 4px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 8px;
}

.white-key:hover {
  background: linear-gradient(to bottom, #f8f8f8 0%, #e8e8e8 100%);
}

.white-key.active {
  background: linear-gradient(to bottom, #4CAF50 0%, #45a049 100%) !important;
  box-shadow: 0 0 20px rgba(76, 175, 80, 0.8);
}

.black-keys {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 60%;
  pointer-events: none;
}

.black-key {
  position: absolute;
  width: calc(100% / 52 * 0.6); /* 假设有52个白键的宽度 */
  height: 100%;
  background: linear-gradient(to bottom, #2c3e50 0%, #1a252f 100%);
  border-radius: 0 0 3px 3px;
  pointer-events: all;
  transform: translateX(-50%);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 6px;
  z-index: 10;
}

.black-key:hover {
  background: linear-gradient(to bottom, #34495e 0%, #2c3e50 100%);
}

.black-key.active {
  background: linear-gradient(to bottom, #4CAF50 0%, #388E3C 100%) !important;
  box-shadow: 0 0 20px rgba(76, 175, 80, 0.8);
}

.key-label {
  font-size: 11px;
  font-weight: bold;
  user-select: none;
}

.white-key .key-label {
  color: #666;
}

.white-key.active .key-label {
  color: white;
}

.black-key .key-label {
  color: #ddd;
}

.black-key.active .key-label {
  color: white;
}
`;


















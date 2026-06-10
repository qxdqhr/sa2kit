/**
 * 和弦识别器
 * Chord Recognizer
 * 
 * 根据检测到的音符识别和弦
 * Recognizes chords based on detected notes
 */

import type { NoteInfo, ChordInfo } from '../types';

interface ChordPattern {
  name: string;
  intervals: number[]; // 相对于根音的半音数
  aliases?: string[];
}

export class ChordRecognizer {
  // 和弦模式定义
  private static readonly CHORD_PATTERNS: ChordPattern[] = [
    // 三和弦
    { name: 'major', intervals: [0, 4, 7], aliases: ['maj', 'M'] },
    { name: 'minor', intervals: [0, 3, 7], aliases: ['min', 'm'] },
    { name: 'diminished', intervals: [0, 3, 6], aliases: ['dim', '°'] },
    { name: 'augmented', intervals: [0, 4, 8], aliases: ['aug', '+'] },
    { name: 'sus2', intervals: [0, 2, 7] },
    { name: 'sus4', intervals: [0, 5, 7] },
    
    // 七和弦
    { name: 'major7', intervals: [0, 4, 7, 11], aliases: ['maj7', 'M7'] },
    { name: 'minor7', intervals: [0, 3, 7, 10], aliases: ['min7', 'm7'] },
    { name: 'dominant7', intervals: [0, 4, 7, 10], aliases: ['7'] },
    { name: 'diminished7', intervals: [0, 3, 6, 9], aliases: ['dim7', '°7'] },
    { name: 'half-diminished7', intervals: [0, 3, 6, 10], aliases: ['m7b5', 'ø7'] },
    { name: 'minor-major7', intervals: [0, 3, 7, 11], aliases: ['mM7', 'm(maj7)'] },
    { name: 'augmented7', intervals: [0, 4, 8, 10], aliases: ['aug7', '+7'] },
    
    // 扩展和弦
    { name: 'major9', intervals: [0, 4, 7, 11, 14], aliases: ['maj9', 'M9'] },
    { name: 'minor9', intervals: [0, 3, 7, 10, 14], aliases: ['min9', 'm9'] },
    { name: 'dominant9', intervals: [0, 4, 7, 10, 14], aliases: ['9'] },
    { name: 'add9', intervals: [0, 4, 7, 14] },
    { name: 'madd9', intervals: [0, 3, 7, 14], aliases: ['m(add9)'] },
  ];

  private static readonly NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  /**
   * 识别和弦
   * Recognize chord from notes
   */
  recognizeChord(notes: NoteInfo[]): ChordInfo | null {
    if (notes.length < 2) {
      return null; // 至少需要2个音符才能构成和弦
    }

    // 按音高排序
    const sortedNotes = [...notes].sort((a, b) => a.midi - b.midi);

    // 去重（相同音符的不同八度）
    const uniqueNoteClasses = this.getUniqueNoteClasses(sortedNotes);
    
    if (uniqueNoteClasses.length < 2) {
      return null;
    }

    // 尝试所有可能的根音
    let bestMatch: { root: string; pattern: ChordPattern; confidence: number } | null = null;

    for (let i = 0; i < uniqueNoteClasses.length; i++) {
      const root = uniqueNoteClasses[i];
      if (!root) continue; // 跳过 undefined
      
      const intervals = this.calculateIntervals(root, uniqueNoteClasses);
      
      // 匹配和弦模式
      for (const pattern of ChordRecognizer.CHORD_PATTERNS) {
        const confidence = this.matchPattern(intervals, pattern.intervals);
        
        if (confidence > 0.8 && (!bestMatch || confidence > bestMatch.confidence)) {
          bestMatch = { root, pattern, confidence };
        }
      }
    }

    if (!bestMatch) {
      return null;
    }

    // 构建和弦信息
    const chordName = (bestMatch.root) + (this.getChordSuffix(bestMatch.pattern));
    
    return {
      name: chordName,
      root: bestMatch.root,
      type: bestMatch.pattern.name,
      notes: sortedNotes,
      confidence: bestMatch.confidence,
    };
  }

  /**
   * 获取唯一的音符类别（不考虑八度）
   * Get unique note classes (ignoring octave)
   */
  private getUniqueNoteClasses(notes: NoteInfo[]): string[] {
    const noteSet = new Set<string>();
    for (const note of notes) {
      noteSet.add(note.noteName);
    }
    return Array.from(noteSet);
  }

  /**
   * 计算音程
   * Calculate intervals from root
   */
  private calculateIntervals(root: string, noteClasses: string[]): number[] {
    const rootIndex = ChordRecognizer.NOTE_NAMES.indexOf(root);
    const intervals: number[] = [];

    for (const noteClass of noteClasses) {
      const noteIndex = ChordRecognizer.NOTE_NAMES.indexOf(noteClass);
      let interval = (noteIndex - rootIndex + 12) % 12;
      intervals.push(interval);
    }

    return intervals.sort((a, b) => a - b);
  }

  /**
   * 匹配和弦模式
   * Match chord pattern
   */
  private matchPattern(intervals: number[], pattern: number[]): number {
    if (intervals.length < pattern.length) {
      return 0;
    }

    let matches = 0;
    for (const patternInterval of pattern) {
      if (intervals.includes(patternInterval)) {
        matches++;
      }
    }

    // 计算匹配度
    const precision = matches / pattern.length;
    const recall = matches / intervals.length;
    
    // 使用F1分数
    if (precision + recall === 0) {
      return 0;
    }
    
    return (2 * precision * recall) / (precision + recall);
  }

  /**
   * 获取和弦后缀
   * Get chord suffix for display
   */
  private getChordSuffix(pattern: ChordPattern): string {
    // 使用最短的别名或原名称
    if (pattern.aliases && pattern.aliases.length > 0) {
      return pattern.aliases[0] || '';
    }
    
    // 转换常见名称
    const suffixMap: { [key: string]: string } = {
      'major': '',
      'minor': 'm',
      'diminished': 'dim',
      'augmented': 'aug',
      'dominant7': '7',
    };
    
    return suffixMap[pattern.name] ?? pattern.name;
  }

  /**
   * 识别八度内的音程（用于简单的音程识别）
   * Recognize interval within an octave
   */
  recognizeInterval(note1: NoteInfo, note2: NoteInfo): string {
    const semitones = Math.abs(note1.midi - note2.midi) % 12;
    
    const intervalNames: { [key: number]: string } = {
      0: '纯一度 (Unison)',
      1: '小二度 (Minor 2nd)',
      2: '大二度 (Major 2nd)',
      3: '小三度 (Minor 3rd)',
      4: '大三度 (Major 3rd)',
      5: '纯四度 (Perfect 4th)',
      6: '增四度/减五度 (Tritone)',
      7: '纯五度 (Perfect 5th)',
      8: '小六度 (Minor 6th)',
      9: '大六度 (Major 6th)',
      10: '小七度 (Minor 7th)',
      11: '大七度 (Major 7th)',
    };
    
    return intervalNames[semitones] || '未知音程';
  }

  /**
   * 分析和弦质量
   * Analyze chord quality
   */
  analyzeChordQuality(chord: ChordInfo): string {
    const qualities: string[] = [];
    
    if (chord.type.includes('major')) {
      qualities.push('大调');
    } else if (chord.type.includes('minor')) {
      qualities.push('小调');
    }
    
    if (chord.type.includes('diminished')) {
      qualities.push('减');
    } else if (chord.type.includes('augmented')) {
      qualities.push('增');
    }
    
    if (chord.type.includes('7')) {
      qualities.push('七和弦');
    } else if (chord.type.includes('9')) {
      qualities.push('九和弦');
    }
    
    if (chord.type.includes('sus')) {
      qualities.push('挂留');
    }
    
    return qualities.join(' ') || '基础和弦';
  }
}


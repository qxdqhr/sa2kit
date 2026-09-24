/**
 * 音乐钩子预留：本期 no-op，日后按 CardDef.musicUrl 播放。
 */
import type { CardDef } from '../types';

let currentAudio: HTMLAudioElement | null = null;

export function playCardMusic(_card: CardDef): void {
  // 本期不播。启用示例：
  // if (!_card.musicUrl) return;
  // stopMusic();
  // currentAudio = new Audio(_card.musicUrl);
  // void currentAudio.play();
  void _card;
}

export function stopMusic(): void {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
}

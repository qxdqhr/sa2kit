import type { CardDef } from '../types';
import { cardManifest } from '../data/cardManifest';

/** 等概率随机抽取一张卡 */
export function pickCard(pool: CardDef[] = cardManifest): CardDef {
  if (pool.length === 0) {
    throw new Error('mikuGacha: card pool is empty');
  }
  const index = Math.floor(Math.random() * pool.length);
  return pool[index]!;
}

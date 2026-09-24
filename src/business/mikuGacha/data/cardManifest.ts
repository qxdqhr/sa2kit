import type { CardDef } from '../types';

const CARD_COUNT = 145;
const PLACEHOLDER_FACE = '/miku-gacha/faces/placeholder.webp';
export const CARD_BACK_URL = '/miku-gacha/back.webp';

/**
 * 145 张卡清单。本期 face 均指向占位图；
 * 真实资源到位后改为 `/miku-gacha/faces/001.webp` …，并可选填 musicUrl。
 */
export const cardManifest: CardDef[] = Array.from({ length: CARD_COUNT }, (_, i) => {
  const id = i + 1;
  const pad = String(id).padStart(3, '0');
  return {
    id,
    name: `Card ${pad}`,
    faceUrl: PLACEHOLDER_FACE,
    // musicUrl: `/miku-gacha/music/${pad}.mp3`, // 日后启用
  };
});

export function getCardById(id: number): CardDef | undefined {
  return cardManifest.find((c) => c.id === id);
}

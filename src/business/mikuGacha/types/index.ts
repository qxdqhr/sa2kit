/**
 * 初音抽卡模块类型
 */

export type GachaPhase = 'idle' | 'drawing' | 'loadingFace' | 'flipping' | 'revealed';

export interface CardDef {
  /** 1..145 */
  id: number;
  name: string;
  faceUrl: string;
  /** 日后 1 卡 1 曲；本期不填、不播 */
  musicUrl?: string;
}

export interface CardGachaViewerProps {
  className?: string;
  /** 卡背纹理 URL */
  backUrl: string;
  /** 当前要展示的正面卡；idle/重置时为 null */
  targetCard: CardDef | null;
  /** 是否启动翻牌（targetCard 纹理就绪后由页面置 true） */
  flipToken: number;
  onFlipComplete?: (card: CardDef) => void;
  onLoadError?: (error: Error) => void;
  onPhaseChange?: (phase: GachaPhase) => void;
}

export interface MikuGachaPageProps {
  className?: string;
}

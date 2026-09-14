import { SpecialEffectType } from './enums';

// 特效基础类型
export interface SpecialBaseEffect {
  type?: SpecialEffectType;
} 

// 弹窗弹出特效
export interface ModalPopEffect extends SpecialBaseEffect {
  type: SpecialEffectType.ModalPop;
  title?: string; 
  content?: string;
  imageUrl?: string;
  buttonText?: string;
}

// 文字抖动特效
export interface TextShakeEffect extends SpecialBaseEffect {
  type: SpecialEffectType.TextShake;
}

// 文字闪烁特效
export interface TextFlashEffect extends SpecialBaseEffect {
  type: SpecialEffectType.TextFlash;
}

// 特效类型联合
export type SpecialEffect = 
  | ModalPopEffect 
  | TextShakeEffect 
  | TextFlashEffect; 
// 题目类型枚举
export enum QuestionType {
  SingleChoice = 'single_choice',
  MultipleChoice = 'multiple_choice',
  FillBlank = 'fill_blank',
  ShortAnswer = 'short_answer',
  Essay = 'essay',
}

// 特效类型枚举
export enum SpecialEffectType {
  //弹窗弹出
  ModalPop = 'modal_pop',
  // 答题界面所有文字抖动
  TextShake = 'text_shake',
  // 答题界面所有文字闪烁
  TextFlash = 'text_flash',
} 
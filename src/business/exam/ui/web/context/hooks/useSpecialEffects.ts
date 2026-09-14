import { useState, useCallback } from 'react';
import { Question, SpecialEffectType, ModalPopEffect } from '../../types';

export const useSpecialEffects = () => {
  const [specialModalOpen, setSpecialModalOpen] = useState(false);
  const [specialModalData, setSpecialModalData] = useState<ModalPopEffect | null>(null);
  const [textShakeEffect, setTextShakeEffect] = useState(false);
  const [textFlashEffect, setTextFlashEffect] = useState(false);
  
  // 检查问题特效并应用
  const checkQuestionEffect = useCallback((index: number, questions: Question[]) => {
    const question = questions[index];
    if (question && question.specialEffect) {
      const effect = question.specialEffect;
      
      // 重置所有特效
      setSpecialModalOpen(false);
      setTextShakeEffect(false);
      setTextFlashEffect(false);
      
      // 应用对应特效
      switch (effect.type) {
        case SpecialEffectType.ModalPop:
          const modalData = effect as ModalPopEffect;
          setSpecialModalData(modalData);
          setSpecialModalOpen(true);
          break;
          
        case SpecialEffectType.TextShake:
          setTextShakeEffect(true);
          break;
          
        case SpecialEffectType.TextFlash:
          setTextFlashEffect(true);
          break;
      }
    }
  }, []);
  
  // 关闭特殊弹窗
  const closeSpecialModal = useCallback(() => {
    setSpecialModalOpen(false);
  }, []);
  
  return {
    specialModalOpen,
    specialModalData,
    textShakeEffect,
    textFlashEffect,
    checkQuestionEffect,
    closeSpecialModal
  };
}; 
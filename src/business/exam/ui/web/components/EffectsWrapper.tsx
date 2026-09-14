"use client";

import { useExam } from '../context';
import styles from '../styles';
import { ReactNode } from 'react';

interface EffectsWrapperProps {
  children: ReactNode;
}

const EffectsWrapper = ({ children }: EffectsWrapperProps) => {
  const { textShakeEffect, textFlashEffect } = useExam();
  
  // 根据当前特效状态选择适当的类名
  const getEffectClassName = () => {
    if (textShakeEffect) {
      return styles['text-shake'];
    }
    if (textFlashEffect) {
      return styles['text-flash'];
    }
    return '';
  };
  
  return (
    <div className={getEffectClassName()}>
      {children}
    </div>
  );
};

export default EffectsWrapper; 
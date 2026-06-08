import React from 'react';
import { Text, View } from '@tarojs/components';
import { sm, smCn } from '../../shared/theme';

interface BookingStepsProps {
  step: 'select' | 'form';
}

const stepDot = (active: boolean, done: boolean) =>
  smCn(
    'flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold shadow-sm transition-colors',
    active && 'bg-gradient-to-r from-moonstone to-cerulean text-white',
    done && !active && 'bg-emerald-500 text-white',
    !active && !done && 'bg-prussian-blue-100 text-prussian-blue-600',
  );

const BookingSteps: React.FC<BookingStepsProps> = ({ step }) => {
  return (
    <View className={smCn('mx-4 mt-4', sm.panel)}>
      <View className="flex items-center gap-3">
        <View className={stepDot(step === 'select', step === 'form')}>
          <Text>{step === 'select' ? '1' : '✓'}</Text>
        </View>
        <Text
          className={smCn(
            'text-sm font-medium',
            step === 'select' ? 'text-moonstone' : 'text-emerald-600',
          )}
        >
          选择画集
        </Text>
        <View className="mx-1 h-px flex-1 bg-prussian-blue-200/80" />
        <View className={stepDot(step === 'form', false)}>
          <Text>2</Text>
        </View>
        <Text
          className={smCn(
            'text-sm font-medium',
            step === 'form' ? 'text-moonstone' : 'text-prussian-blue-500',
          )}
        >
          填写信息
        </Text>
      </View>
    </View>
  );
};

export default BookingSteps;

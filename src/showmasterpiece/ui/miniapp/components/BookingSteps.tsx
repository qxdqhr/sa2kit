import React from 'react';
import { Text, View } from '@tarojs/components';

interface BookingStepsProps {
  step: 'select' | 'form';
}

const BookingSteps: React.FC<BookingStepsProps> = ({ step }) => {
  return (
    <View className="mx-4 mt-4 flex items-center gap-3">
      <View
        className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs ${
          step === 'select' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600'
        }`}
      >
        <Text>{step === 'select' ? '1' : '✓'}</Text>
        <Text>选择画集</Text>
      </View>
      <View className="h-px flex-1 bg-slate-200" />
      <View
        className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs ${
          step === 'form' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600'
        }`}
      >
        <Text>2</Text>
        <Text>填写信息</Text>
      </View>
    </View>
  );
};

export default BookingSteps;

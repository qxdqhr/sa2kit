import React from 'react';
import { Text, View } from '@tarojs/components';

interface BookingStepsProps {
  step: 'select' | 'form';
}

const BookingSteps: React.FC<BookingStepsProps> = ({ step }) => {
  return (
    <View className="mx-4 mt-4 flex items-center justify-center">
      <View className="flex items-center">
        <View
          className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold ${
            step === 'select' ? 'bg-blue-600 text-white' : 'bg-green-500 text-white'
          }`}
        >
          <Text>{step === 'select' ? '1' : '✓'}</Text>
        </View>
        <Text className={`ml-2 text-sm ${step === 'select' ? 'text-blue-600' : 'text-green-600'}`}>
          选择画集
        </Text>
      </View>
      <View className="mx-4 h-px w-10 bg-slate-300" />
      <View className="flex items-center">
        <View
          className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold ${
            step === 'form' ? 'bg-blue-600 text-white' : 'bg-slate-300 text-slate-600'
          }`}
        >
          <Text>2</Text>
        </View>
        <Text className={`ml-2 text-sm ${step === 'form' ? 'text-blue-600' : 'text-slate-500'}`}>
          填写信息
        </Text>
      </View>
    </View>
  );
};

export default BookingSteps;

import React from 'react';
import { Text, View } from '@tarojs/components';

interface BookingStepsProps {
  step: 'select' | 'form';
}

const BookingSteps: React.FC<BookingStepsProps> = ({ step }) => {
  return (
    <View className="mx-4 mt-4 rounded-3xl border border-prussian-blue-200 bg-white px-4 py-4 shadow-sm">
      <View className="flex items-center">
        <View
          className={`h-9 w-9 rounded-full flex items-center justify-center text-xs font-semibold ${
            step === 'select'
              ? 'bg-gradient-to-r from-moonstone to-cerulean text-white'
              : 'bg-emerald-500 text-white'
          }`}
        >
          <Text>{step === 'select' ? '1' : '✓'}</Text>
        </View>
        <Text
          className={`ml-2 text-sm font-medium ${
            step === 'select' ? 'text-moonstone' : 'text-emerald-600'
          }`}
        >
          选择画集
        </Text>
      </View>
      <View className="mx-4 h-px w-10 bg-prussian-blue-200" />
      <View className="flex items-center">
        <View
          className={`h-9 w-9 rounded-full flex items-center justify-center text-xs font-semibold ${
            step === 'form'
              ? 'bg-gradient-to-r from-moonstone to-cerulean text-white'
              : 'bg-prussian-blue-100 text-prussian-blue-600'
          }`}
        >
          <Text>2</Text>
        </View>
        <Text
          className={`ml-2 text-sm font-medium ${
            step === 'form' ? 'text-moonstone' : 'text-prussian-blue-500'
          }`}
        >
          填写信息
        </Text>
      </View>
    </View>
  );
};

export default BookingSteps;

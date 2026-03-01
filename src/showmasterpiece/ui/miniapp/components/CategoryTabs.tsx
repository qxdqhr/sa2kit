import React from 'react';
import { ScrollView, Text, View } from '@tarojs/components';

export type CategoryTabItem<T extends string = string> = {
  value: T;
  label: string;
  count?: number;
};

interface CategoryTabsProps<T extends string = string> {
  items: CategoryTabItem<T>[];
  activeValue: T;
  onChange: (value: T) => void;
}

function CategoryTabs<T extends string = string>({
  items,
  activeValue,
  onChange
}: CategoryTabsProps<T>) {
  return (
    <ScrollView scrollX className="mt-4" showScrollbar={false}>
      <View className="flex gap-2 rounded-2xl bg-moonstone-900/10 p-1">
        {items.map(item => {
          const isActive = activeValue === item.value;
          return (
            <View
              key={item.value}
              className={`flex flex-col items-center justify-center rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-moonstone to-cerulean text-white shadow-lg'
                  : 'text-prussian-blue-700'
              }`}
              onClick={() => onChange(item.value)}
            >
              <Text>{item.label}</Text>
              {typeof item.count === 'number' && (
                <Text
                  className={`mt-1 rounded-full px-2 py-0.5 text-[10px] ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-moonstone-900/10 text-cerulean'
                  }`}
                >
                  {item.count}
                </Text>
              )}
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

export default CategoryTabs;

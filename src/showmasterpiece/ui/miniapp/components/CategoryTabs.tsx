import React from 'react';
import { ScrollView, Text, View } from '@tarojs/components';

export type CategoryTabItem<T extends string = string> = {
  value: T;
  label: string;
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
    <ScrollView scrollX className="mt-3" showScrollbar={false}>
      <View className="flex gap-2 pb-2">
        {items.map(item => (
          <View
            key={item.value}
            className={`rounded-full px-4 py-2 text-xs ${
              activeValue === item.value
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-600 shadow-md'
            }`}
            onClick={() => onChange(item.value)}
          >
            <Text>{item.label}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

export default CategoryTabs;

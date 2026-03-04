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
  const total = items.length || 1;
  const activeIndex = Math.max(
    items.findIndex(item => item.value === activeValue),
    0
  );
  const progressWidth = `${((activeIndex + 1) / total) * 100}%`;

  return (
    <View className="mt-3">
      <ScrollView scrollX showScrollbar>
        <View className="flex gap-3 pb-1">
          {items.map(item => {
            const isActive = activeValue === item.value;
            return (
              <View
                key={item.value}
                className={`flex h-20 w-28 shrink-0 flex-col justify-between rounded-2xl border px-3 py-3 transition-all ${
                  isActive
                    ? 'border-sky-500 bg-sky-500 text-white shadow-lg'
                    : 'border-prussian-blue-200 bg-white text-prussian-blue-700'
                }`}
                onClick={() => onChange(item.value)}
              >
                <Text className="text-xs font-semibold leading-4 whitespace-nowrap">{item.label}</Text>
                {typeof item.count === 'number' && (
                  <Text
                    className={`self-start rounded-full px-2 py-1 text-xs ${
                      isActive
                        ? 'bg-white text-sky-600'
                        : 'bg-prussian-blue-100 text-prussian-blue-700'
                    }`}
                  >
                    {item.count} 个
                  </Text>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>
      <View className="mt-2 h-2 w-full overflow-hidden rounded-full bg-prussian-blue-100">
        <View className="h-full rounded-full bg-sky-500 transition-all" style={{ width: progressWidth }} />
      </View>
    </View>
  );
}

export default CategoryTabs;

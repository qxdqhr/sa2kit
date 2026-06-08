import React from 'react';
import { ScrollView, Text, View } from '@tarojs/components';
import { sm, smCn } from '../../shared/theme';

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
  onChange,
}: CategoryTabsProps<T>) {
  return (
    <View className="mt-3">
      <ScrollView scrollX showScrollbar={false}>
        <View className="flex gap-3 pb-1">
          {items.map((item) => {
            const isActive = activeValue === item.value;
            return (
              <View
                key={item.value}
                className={smCn(sm.tab, isActive ? sm.tabActive : sm.tabInactive)}
                onClick={() => onChange(item.value)}
              >
                <Text className="whitespace-nowrap text-xs font-semibold leading-4">
                  {item.label}
                </Text>
                {typeof item.count === 'number' && (
                  <Text
                    className={isActive ? sm.tabCountActive : sm.tabCountInactive}
                  >
                    {item.count} 个
                  </Text>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

export default CategoryTabs;

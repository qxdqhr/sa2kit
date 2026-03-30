import React from 'react';
import { Text, View } from '@tarojs/components';

type HeaderAction = {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'ghost';
};

type HeaderCta = {
  label: string;
  onClick: () => void;
};

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: HeaderAction[];
  cta?: HeaderCta;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, actions, cta }) => {
  return (
    <View className="border-b border-prussian-blue-200 bg-white px-4 py-4">
      <View className="flex items-start justify-between gap-3">
        <View className="flex-1">
          <Text className="text-xl font-bold text-rich-black">{title}</Text>
          {subtitle && <Text className="mt-1 block text-sm text-prussian-blue-600">{subtitle}</Text>}
        </View>
        {actions && actions.length > 0 && (
          <View className="flex items-center gap-2">
            {actions.map(action => (
              <View
                key={action.label}
                className={
                  action.variant === 'ghost'
                    ? 'flex h-9 items-center justify-center rounded-full border border-prussian-blue-200 bg-white px-4'
                    : 'flex h-9 items-center justify-center rounded-full bg-gradient-to-r from-moonstone to-cerulean px-4 shadow-lg'
                }
                onClick={action.onClick}
              >
                <Text
                  className={
                    action.variant === 'ghost'
                      ? 'text-xs font-semibold text-prussian-blue-700'
                      : 'text-xs font-semibold text-white'
                  }
                >
                  {action.label}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
      {cta && (
        <View
          className="mt-4 flex h-10 items-center justify-center rounded-full bg-gradient-to-r from-moonstone to-cerulean px-4 shadow-lg"
          onClick={cta.onClick}
        >
          <Text className="text-sm font-semibold text-white">{cta.label}</Text>
        </View>
      )}
    </View>
  );
};

export default PageHeader;

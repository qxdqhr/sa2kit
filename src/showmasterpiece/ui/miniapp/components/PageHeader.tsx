import React from 'react';
import { Button, Text, View } from '@tarojs/components';

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
    <View className="bg-white/95 px-4 py-4 border-b border-prussian-blue-200/30">
      <View className="flex items-start justify-between gap-3">
        <View className="flex-1">
          <Text className="text-lg font-bold text-rich-black">{title}</Text>
          {subtitle && <Text className="mt-1 block text-xs text-prussian-blue-600">{subtitle}</Text>}
        </View>
        {actions && actions.length > 0 && (
          <View className="flex items-center gap-2">
            {actions.map(action => (
              <Button
                key={action.label}
                className={
                  action.variant === 'ghost'
                    ? 'h-8 rounded-full border border-prussian-blue-200 bg-white px-3 text-xs font-semibold text-prussian-blue-700'
                    : 'h-8 rounded-full bg-gradient-to-r from-moonstone to-cerulean px-3 text-xs font-semibold text-white shadow-lg'
                }
                onClick={action.onClick}
              >
                {action.label}
              </Button>
            ))}
          </View>
        )}
      </View>
      {cta && (
        <Button
          className="mt-3 h-9 rounded-full bg-gradient-to-r from-moonstone to-cerulean px-4 text-xs font-semibold text-white shadow-lg"
          onClick={cta.onClick}
        >
          {cta.label}
        </Button>
      )}
    </View>
  );
};

export default PageHeader;

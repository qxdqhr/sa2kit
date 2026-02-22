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
    <View className="mx-4 mt-6 rounded-3xl bg-white px-5 py-5 shadow-xl">
      <View className="flex items-start justify-between">
        <View>
          <Text className="text-xl font-semibold">{title}</Text>
          {subtitle && <Text className="mt-2 block text-sm text-slate-500">{subtitle}</Text>}
        </View>
        {actions && actions.length > 0 && (
          <View className="flex flex-col items-end gap-2">
            {actions.map(action => (
              <Button
                key={action.label}
                className={
                  action.variant === 'ghost'
                    ? 'h-8 rounded-full border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700'
                    : 'h-8 rounded-full bg-slate-900 px-4 text-xs font-semibold text-white'
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
          className="mt-4 h-10 w-32 rounded-full bg-slate-900 text-sm font-semibold text-white"
          onClick={cta.onClick}
        >
          {cta.label}
        </Button>
      )}
    </View>
  );
};

export default PageHeader;

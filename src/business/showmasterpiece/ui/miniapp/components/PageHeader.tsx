import React from 'react';
import { Text, View } from '@tarojs/components';
import { sm, smCn } from '../../shared/theme';

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
    <View className={sm.header}>
      <View className="flex items-start justify-between gap-3">
        <View className="flex-1">
          <Text className={sm.titleLg}>{title}</Text>
          {subtitle && <Text className={smCn(sm.subtitle, 'mt-1 block')}>{subtitle}</Text>}
        </View>
        {actions && actions.length > 0 && (
          <View className="flex items-center gap-2">
            {actions.map((action) => (
              <View
                key={action.label}
                className={action.variant === 'ghost' ? sm.btnGhost : sm.btnPrimary}
                onClick={action.onClick}
              >
                <Text
                  className={
                    action.variant === 'ghost' ? sm.btnTextGhost : sm.btnTextPrimary
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
        <View className={smCn(sm.btnPrimary, 'mt-4 w-full')} onClick={cta.onClick}>
          <Text className={sm.btnTextPrimary}>{cta.label}</Text>
        </View>
      )}
    </View>
  );
};

export default PageHeader;

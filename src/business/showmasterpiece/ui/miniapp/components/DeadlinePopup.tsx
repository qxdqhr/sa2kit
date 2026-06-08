import React, { useEffect, useMemo, useState } from 'react';
import { Button, Text, View } from '@tarojs/components';
import type { PopupConfig } from '../../../types/popup';
import { smCn } from '../../shared/theme';

interface DeadlinePopupManagerProps {
  configs: PopupConfig[];
  onClose: (configId: string) => void;
  onConfirm?: (configId: string) => void;
  onCancel?: (configId: string) => void;
}

type PopupTheme = 'warning' | 'info' | 'error' | 'success';
type ThemeStyle = { title: string; body: string; panel: string; button: string; cancel: string };

const themeStyles: Record<PopupTheme, ThemeStyle> = {
  warning: {
    title: 'text-amber-900',
    body: 'text-amber-800',
    panel: 'bg-amber-50 ring-amber-200/80',
    button: 'bg-amber-600 shadow-[0_2px_8px_rgba(217,119,6,0.35)]',
    cancel: 'border-amber-200 text-amber-800',
  },
  info: {
    title: 'text-prussian-blue-900',
    body: 'text-prussian-blue-700',
    panel: 'bg-prussian-blue-50 ring-prussian-blue-200/80',
    button: 'bg-gradient-to-r from-moonstone to-cerulean shadow-[0_2px_10px_rgba(30,136,229,0.35)]',
    cancel: 'border-prussian-blue-200 text-prussian-blue-700',
  },
  error: {
    title: 'text-rose-900',
    body: 'text-rose-800',
    panel: 'bg-rose-50 ring-rose-200/80',
    button: 'bg-rose-600 shadow-[0_2px_8px_rgba(225,29,72,0.3)]',
    cancel: 'border-rose-200 text-rose-700',
  },
  success: {
    title: 'text-emerald-900',
    body: 'text-emerald-800',
    panel: 'bg-emerald-50 ring-emerald-200/80',
    button: 'bg-emerald-600 shadow-[0_2px_8px_rgba(5,150,105,0.35)]',
    cancel: 'border-emerald-200 text-emerald-700',
  },
};

const DeadlinePopupManager: React.FC<DeadlinePopupManagerProps> = ({
  configs,
  onClose,
  onConfirm,
  onCancel,
}) => {
  const [index, setIndex] = useState(0);
  const current = configs[index];
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (!configs.length) setIndex(0);
    if (index >= configs.length) setIndex(0);
  }, [configs.length, index]);

  useEffect(() => {
    if (!current?.displayConfig?.autoCloseSeconds) {
      setCountdown(0);
      return;
    }

    setCountdown(current.displayConfig.autoCloseSeconds);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onClose(current.id);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [current, onClose]);

  const styles = useMemo<ThemeStyle>(() => {
    const key = current?.contentConfig?.theme as PopupTheme | undefined;
    return key && themeStyles[key] ? themeStyles[key] : themeStyles.warning;
  }, [current]);

  if (!current) return null;

  const confirmText = current.contentConfig.confirmText || '确定';
  const cancelText = current.contentConfig.cancelText || '取消';
  const showCancel = current.contentConfig.showCancel !== false;

  const handleConfirm = () => {
    onConfirm?.(current.id);
  };

  const handleCancel = () => {
    onCancel?.(current.id);
  };

  return (
    <View
      className="fixed inset-0 flex items-center justify-center bg-rich-black/50 px-5 backdrop-blur-sm"
      style={{ zIndex: 1000 }}
    >
      <View
        className={smCn(
          'w-full max-w-md rounded-2xl p-5 shadow-[0_8px_32px_rgba(0,0,0,0.12)] ring-1',
          styles.panel,
        )}
      >
        <Text className={smCn('text-base font-semibold text-balance', styles.title)}>
          {current.contentConfig.title}
        </Text>
        {countdown > 0 && (
          <Text className="mt-2 block text-xs tabular-nums text-prussian-blue-500">
            {countdown} 秒后自动关闭
          </Text>
        )}
        <Text className={smCn('mt-3 block whitespace-pre-wrap text-sm text-pretty', styles.body)}>
          {current.contentConfig.message}
        </Text>
        <View className="mt-5 flex justify-end gap-2">
          {showCancel && (
            <Button
              className={smCn(
                'h-10 min-h-10 rounded-full border bg-white px-4 text-xs font-semibold transition-transform active:scale-[0.96]',
                styles.cancel,
              )}
              onClick={handleCancel}
            >
              {cancelText}
            </Button>
          )}
          <Button
            className={smCn(
              'h-10 min-h-10 rounded-full px-4 text-xs font-semibold text-white transition-transform active:scale-[0.96]',
              styles.button,
            )}
            onClick={handleConfirm}
          >
            {confirmText}
          </Button>
        </View>
      </View>
    </View>
  );
};

export default DeadlinePopupManager;

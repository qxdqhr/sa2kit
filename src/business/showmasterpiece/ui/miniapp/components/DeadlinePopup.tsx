import React, { useEffect, useMemo, useState } from 'react';
import { Button, Text, View } from '@tarojs/components';
import type { PopupConfig } from '../../../types/popup';

interface DeadlinePopupManagerProps {
  configs: PopupConfig[];
  onClose: (configId: string) => void;
  onConfirm?: (configId: string) => void;
  onCancel?: (configId: string) => void;
}

type PopupTheme = 'warning' | 'info' | 'error' | 'success';
type ThemeStyle = { title: string; body: string; panel: string; button: string };

const themeStyles: Record<PopupTheme, ThemeStyle> = {
  warning: {
    title: 'text-amber-800',
    body: 'text-amber-700',
    panel: 'bg-amber-50 border-amber-200',
    button: 'bg-amber-600',
  },
  info: {
    title: 'text-blue-800',
    body: 'text-blue-700',
    panel: 'bg-blue-50 border-blue-200',
    button: 'bg-blue-600',
  },
  error: {
    title: 'text-rose-800',
    body: 'text-rose-700',
    panel: 'bg-rose-50 border-rose-200',
    button: 'bg-rose-600',
  },
  success: {
    title: 'text-emerald-800',
    body: 'text-emerald-700',
    panel: 'bg-emerald-50 border-emerald-200',
    button: 'bg-emerald-600',
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
    <View className="fixed inset-0 flex items-center justify-center bg-black px-5" style={{ zIndex: 1000 }}>
      <View className={`w-full max-w-md rounded-2xl border p-4 shadow-2xl ${styles.panel}`}>
        <Text className={`text-base font-semibold ${styles.title}`}>{current.contentConfig.title}</Text>
        {countdown > 0 && (
          <Text className="mt-2 block text-xs text-slate-500">{countdown} 秒后自动关闭</Text>
        )}
        <Text className={`mt-3 block whitespace-pre-wrap text-sm ${styles.body}`}>
          {current.contentConfig.message}
        </Text>
        <View className="mt-4 flex justify-end gap-2">
          {showCancel && (
            <Button
              className="h-8 rounded-full border border-slate-300 bg-white px-4 text-xs font-semibold text-slate-700"
              onClick={handleCancel}
            >
              {cancelText}
            </Button>
          )}
          <Button
            className={`h-8 rounded-full px-4 text-xs font-semibold text-white ${styles.button}`}
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

/**
 * ShowMasterpiece 模块 - 限时弹窗组件
 * 
 * 基于配置显示限时提醒弹窗
 * 
 * @fileoverview 限时弹窗组件
 */

'use client';

import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock, Info, CheckCircle, XCircle } from 'lucide-react';
import { Modal } from '@/components';
import type { PopupConfig } from '../server/schema/popupConfig';

/**
 * 限时弹窗组件属性
 */
interface DeadlinePopupProps {
  /** 弹窗配置 */
  config: PopupConfig;
  /** 是否显示弹窗 */
  isOpen: boolean;
  /** 关闭回调 */
  onClose: () => void;
  /** 确认回调 */
  onConfirm?: () => void;
  /** 取消回调 */
  onCancel?: () => void;
}

/**
 * 限时弹窗组件
 */
export const DeadlinePopup: React.FC<DeadlinePopupProps> = ({
  config,
  isOpen,
  onClose,
  onConfirm,
  onCancel,
}) => {
  const [countdown, setCountdown] = useState<number>(0);

  // 获取主题图标
  const getThemeIcon = (theme: string = 'warning') => {
    const iconProps = { size: 24, className: 'flex-shrink-0' };
    
    switch (theme) {
      case 'warning':
        return <AlertTriangle {...iconProps} className="text-amber-500" />;
      case 'info':
        return <Info {...iconProps} className="text-blue-500" />;
      case 'error':
        return <XCircle {...iconProps} className="text-red-500" />;
      case 'success':
        return <CheckCircle {...iconProps} className="text-green-500" />;
      default:
        return <Clock {...iconProps} className="text-slate-500" />;
    }
  };

  // 获取主题样式
  const getThemeStyles = (theme: string = 'warning') => {
    switch (theme) {
      case 'warning':
        return {
          bgColor: 'bg-amber-50',
          borderColor: 'border-amber-200',
          titleColor: 'text-amber-800',
          messageColor: 'text-amber-700',
          confirmButton: 'bg-amber-600 hover:bg-amber-700 text-white',
        };
      case 'info':
        return {
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          titleColor: 'text-blue-800',
          messageColor: 'text-blue-700',
          confirmButton: 'bg-blue-600 hover:bg-blue-700 text-white',
        };
      case 'error':
        return {
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          titleColor: 'text-red-800',
          messageColor: 'text-red-700',
          confirmButton: 'bg-red-600 hover:bg-red-700 text-white',
        };
      case 'success':
        return {
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          titleColor: 'text-green-800',
          messageColor: 'text-green-700',
          confirmButton: 'bg-green-600 hover:bg-green-700 text-white',
        };
      default:
        return {
          bgColor: 'bg-slate-50',
          borderColor: 'border-slate-200',
          titleColor: 'text-slate-800',
          messageColor: 'text-slate-700',
          confirmButton: 'bg-slate-600 hover:bg-slate-700 text-white',
        };
    }
  };

  // 自动关闭倒计时
  useEffect(() => {
    if (!isOpen || !config.displayConfig?.autoCloseSeconds) return;

    const autoCloseSeconds = config.displayConfig.autoCloseSeconds;
    setCountdown(autoCloseSeconds);

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, config.displayConfig?.autoCloseSeconds, onClose]);

  // 处理确认
  const handleConfirm = () => {
    onConfirm?.();
    onClose();
  };

  // 处理取消
  const handleCancel = () => {
    onCancel?.();
    onClose();
  };

  const { contentConfig, displayConfig } = config;
  const theme = contentConfig.theme || 'warning';
  const styles = getThemeStyles(theme);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      width={displayConfig?.width || 400}
      maskClosable={displayConfig?.maskClosable ?? true}
      zIndex={9999}
    >
      <div className={`${styles.bgColor} ${styles.borderColor} border rounded-lg p-6`}>
        {/* 图标和标题 */}
        <div className="flex items-start gap-4 mb-4">
          {getThemeIcon(theme)}
          <div className="flex-1 min-w-0">
            <h3 className={`text-lg font-semibold ${styles.titleColor} mb-2`}>
              {contentConfig.title}
            </h3>
            
            {/* 自动关闭倒计时 */}
            {countdown > 0 && (
              <div className="text-sm text-slate-500 mb-2">
                <Clock size={14} className="inline mr-1" />
                {countdown} 秒后自动关闭
              </div>
            )}
          </div>
        </div>

        {/* 弹窗内容 */}
        <div className={`${styles.messageColor} mb-6 leading-relaxed whitespace-pre-wrap`}>
          {contentConfig.message}
        </div>

        {/* 操作按钮 */}
        <div className="flex justify-end gap-3">
          {contentConfig.showCancel !== false && (
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-slate-600 hover:text-slate-700 transition-colors"
            >
              {contentConfig.cancelText || '取消'}
            </button>
          )}
          <button
            onClick={handleConfirm}
            className={`px-4 py-2 rounded-md transition-colors ${styles.confirmButton}`}
          >
            {contentConfig.confirmText || '确定'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

/**
 * 多弹窗管理组件
 */
interface DeadlinePopupManagerProps {
  /** 弹窗配置列表 */
  configs: PopupConfig[];
  /** 关闭回调 */
  onClose: (configId: string) => void;
  /** 确认回调 */
  onConfirm?: (configId: string) => void;
  /** 取消回调 */
  onCancel?: (configId: string) => void;
}

export const DeadlinePopupManager: React.FC<DeadlinePopupManagerProps> = ({
  configs,
  onClose,
  onConfirm,
  onCancel,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // 处理当前弹窗关闭
  const handleClose = () => {
    const currentConfig = configs[currentIndex];
    if (!currentConfig) return;
    onClose(currentConfig.id);
    
    // 显示下一个弹窗
    if (currentIndex < configs.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  // 处理确认
  const handleConfirm = () => {
    const currentConfig = configs[currentIndex];
    if (!currentConfig) return;
    onConfirm?.(currentConfig.id);
    handleClose();
  };

  // 处理取消
  const handleCancel = () => {
    const currentConfig = configs[currentIndex];
    if (!currentConfig) return;
    onCancel?.(currentConfig.id);
    handleClose();
  };

  // 重置索引当配置变化时
  useEffect(() => {
    if (configs.length === 0) {
      setCurrentIndex(0);
    } else if (currentIndex >= configs.length) {
      setCurrentIndex(0);
    }
  }, [configs.length, currentIndex]);

  if (configs.length === 0 || currentIndex >= configs.length) {
    return null;
  }

  const currentConfig = configs[currentIndex];
  if (!currentConfig) {
    return null;
  }

  return (
    <DeadlinePopup
      config={currentConfig}
      isOpen={true}
      onClose={handleClose}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  );
};

export default DeadlinePopup;

'use client';

import React, { ReactNode, useEffect } from 'react';
import { cn } from '../utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  width?: string | number;
  height?: string | number;
  maskClosable?: boolean;
  className?: string;
  contentClassName?: string;
  showCloseButton?: boolean;
  zIndex?: number;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  width = 600,
  height,
  maskClosable = true,
  className = '',
  contentClassName = '',
  showCloseButton = true,
  zIndex,
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: zIndex || 50 }}>
      <div 
        className="fixed inset-0 bg-black/50 transition-opacity" 
        onClick={() => maskClosable && onClose()}
      />
      <div 
        className={cn(
          "bg-white rounded-xl shadow-2xl z-10 overflow-hidden flex flex-col transition-all transform scale-100",
          className
        )}
        style={{ 
          width: typeof width === 'number' ? `${width}px` : width, 
          height: typeof height === 'number' ? `${height}px` : height, 
          maxWidth: '100%' 
        }}
      >
        {(title || showCloseButton) && (
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
            {showCloseButton && (
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                <span className="text-2xl">&times;</span>
              </button>
            )}
          </div>
        )}
        <div className={cn("flex-1 overflow-y-auto", contentClassName)}>
          {children}
        </div>
      </div>
    </div>
  );
};

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  className?: string;
  zIndex?: number;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = '确定',
  cancelText = '取消',
  isLoading = false,
  className = '',
  zIndex,
}) => {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} width={400} className={className} zIndex={zIndex}>
      <div className="p-6">
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={isLoading}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center"
            disabled={isLoading}
          >
            {isLoading && (
              <div className="mr-2 w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};

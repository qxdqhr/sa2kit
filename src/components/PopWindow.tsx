'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './Dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './AlertDialog';
import { cn } from '@/utils';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  width?: number | string;
  className?: string;
  maskClosable?: boolean;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  width,
  className,
  maskClosable = true,
  children,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        if (maskClosable) {
          onClose();
        } else {
          // If maskClosable is false, we don't allow closing via backdrop/ESC
          // This is a bit tricky with Radix UI Dialog, but we can manage it
        }
      }
    }}>
      <DialogContent 
        className={cn("sm:max-w-[425px]", className)}
        onPointerDownOutside={(e) => {
          if (!maskClosable) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (!maskClosable) e.preventDefault();
        }}
        style={width ? { maxWidth: typeof width === 'number' ? `${width}px` : width } : undefined}
      >
        {title && (
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
        )}
        <div className="py-4">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = "确认操作",
  message,
  confirmText = "确认",
  cancelText = "取消",
  isLoading = false,
}) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{message}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>{cancelText}</AlertDialogCancel>
          <AlertDialogAction 
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? "处理中..." : confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};


/**
 * ShowMasterpiece 模块 - 预订弹窗组件
 * 
 * 使用现有的Modal组件包装预订页面，提供弹窗形式的预订功能
 * 
 * @fileoverview 预订弹窗组件
 */

'use client';

import React from 'react';
import { Modal } from '@/components';
import { BookingPage } from './';

/**
 * 预订弹窗组件属性
 */
interface BookingModalProps {
  /** 是否显示弹窗 */
  isOpen: boolean;
  
  /** 关闭弹窗回调 */
  onClose: () => void;
  
  /** 弹窗标题 */
  title?: string;
  
  /** 弹窗宽度 */
  width?: number | string;
  
  /** 弹窗高度 */
  height?: number | string;
}

/**
 * 预订弹窗组件
 * 
 * @param props 组件属性
 * @returns React组件
 */
export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  title = '预订画集',
  width = '90vw',
  height = '90vh',
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      width={width}
      maskClosable={false}
      className="max-w-6xl"
    >
      <BookingPage onClose={onClose} />
    </Modal>
  );
}; 

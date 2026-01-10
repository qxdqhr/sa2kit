'use client';

import React, { useState, useEffect } from 'react';
import ProfileModal from './ProfileModal';
import { ProfileData } from './types';
import { BadgeList } from './internal/BadgeList';
import { StatList } from './internal/StatList';

export interface AutoOpenModalProps {
  data: ProfileData;
  delay?: number; // 延迟显示时间(毫秒)
  themeName?: 'light' | 'dark' | 'blue';
  onClose?: () => void;
}

/**
 * 自动打开个人信息弹窗组件
 * 页面加载后自动显示弹窗
 */
export const AutoOpenModal: React.FC<AutoOpenModalProps> = ({
  data,
  delay = 500, // 默认延迟500毫秒
  themeName = 'light',
  onClose,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 页面加载后自动显示弹窗
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsModalOpen(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  const handleClose = () => {
    setIsModalOpen(false);
    if (onClose) {
      onClose();
    }
  };

  const handleContactClick = (type: string, value: string) => {
    if (type === '邮箱') {
      window.open('mailto:' + (value));
    } else if (type === '电话') {
      window.open('tel:' + (value));
    }
  };

  return (
    <ProfileModal
      isOpen={isModalOpen}
      onClose={handleClose}
      data={data}
      themeName={themeName}
      onContactClick={handleContactClick}
      onSocialLinkClick={(url) => window.open(url, '_blank')}
    >
      {data.badges && <BadgeList badges={data.badges} />}
      {data.stats && <StatList stats={data.stats} />}
    </ProfileModal>
  );
};

export default AutoOpenModal;

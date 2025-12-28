'use client';

import React, { useState } from 'react';
import ProfileModal from './ProfileModal';
import { ProfileData } from './types';
import { BadgeList } from './internal/BadgeList';
import { StatList } from './internal/StatList';
import { Button } from '../components/Button';

// 示例数据
const exampleProfileData: ProfileData = {
  name: '张三',
  avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
  title: '高级前端工程师',
  bio: '专注于React和Next.js开发的前端工程师，有5年工作经验。热爱开源，喜欢分享技术经验。',
  contacts: {
    '邮箱': 'zhangsan@example.com',
    '电话': '138-8888-8888',
    '地址': '上海市浦东新区',
  },
  socialLinks: [
    { type: 'GitHub', url: 'https://github.com/zhangsan', icon: '★' },
    { type: 'Twitter', url: 'https://twitter.com/zhangsan', icon: '✦' },
    { type: 'LinkedIn', url: 'https://linkedin.com/in/zhangsan', icon: '✪' },
  ],
  badges: [
    { label: 'React', type: 'primary' },
    { label: 'Next.js', type: 'success' },
    { label: 'TypeScript', type: 'info' },
    { label: 'CSS', type: 'default' },
  ],
  stats: [
    { label: '项目', value: 42 },
    { label: '粉丝', value: 1024 },
    { label: '评分', value: '4.9' },
  ],
  customContent: (
    <div className="mt-5 border-t border-gray-100 pt-4">
      <h3 className="text-sm font-semibold mb-2">专业技能</h3>
      <p className="text-sm text-gray-600 leading-relaxed">
        精通React、Vue、Angular等前端框架，熟悉TypeScript、JavaScript、CSS3、HTML5等前端技术。
        有丰富的大型项目开发经验，能独立负责前端架构设计。
      </p>
    </div>
  ),
};

export interface ProfileButtonProps {
  data?: ProfileData;
  buttonText?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  modalTheme?: 'light' | 'dark' | 'blue';
}

/**
 * 个人信息按钮组件，点击后显示个人信息弹窗
 */
export const ProfileButton: React.FC<ProfileButtonProps> = ({
  data = exampleProfileData,
  buttonText = '查看个人信息',
  variant = 'default',
  size = 'default',
  className = '',
  modalTheme = 'light',
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const handleContactClick = (type: string, value: string) => {
    if (type === '邮箱') {
      window.open(`mailto:${value}`);
    } else if (type === '电话') {
      window.open(`tel:${value}`);
    }
  };

  return (
    <>
      <Button 
        variant={variant}
        size={size}
        onClick={openModal} 
        className={className}
      >
        {buttonText}
      </Button>

      <ProfileModal
        isOpen={isModalOpen}
        onClose={closeModal}
        data={data}
        themeName={modalTheme}
        onContactClick={handleContactClick}
        onSocialLinkClick={(url) => window.open(url, '_blank')}
      >
        {data.customContent}
        {data.badges && <BadgeList badges={data.badges} />}
        {data.stats && <StatList stats={data.stats} />}
      </ProfileModal>
    </>
  );
};

export default ProfileButton;

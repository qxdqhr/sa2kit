'use client';

import React from 'react';
import { Modal } from '../../common/ui/admin/Modal';
import { Avatar, AvatarImage, AvatarFallback } from '../../common/ui/patterns/Avatar';
import { ProfileData, SocialLink } from './types';
import { cn } from '../../common/utils';

const themeStyles = {
  light: '',
  dark: 'bg-[#222] text-[#eee] border-[#444]',
  blue: 'bg-[#f0f8ff] border-[#1890ff]/20',
};

export interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ProfileData;
  showAvatar?: boolean;
  showContacts?: boolean;
  showSocial?: boolean;
  showBio?: boolean;
  avatarSize?: number;
  onAvatarClick?: () => void;
  onSocialLinkClick?: (url: string, type: string) => void;
  onContactClick?: (type: string, value: string) => void;
  themeName?: 'light' | 'dark' | 'blue';
  className?: string;
  children?: React.ReactNode;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  data,
  showAvatar = true,
  showContacts = true,
  showSocial = true,
  showBio = true,
  avatarSize = 80,
  onAvatarClick,
  onSocialLinkClick,
  onContactClick,
  themeName = 'light',
  className,
}) => {
  const renderSocialLinks = () => {
    if (!data.socialLinks || data.socialLinks.length === 0) return null;
    return (
      <div className="mt-2 flex gap-3">
        {data.socialLinks.map((link: SocialLink, index: number) => (
          <a
            key={index}
            href={link.url}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-full no-underline transition-all hover:-translate-y-0.5',
              themeName === 'dark'
                ? 'bg-gray-800 text-gray-200 hover:bg-gray-700'
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200',
            )}
            title={link.type}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              if (onSocialLinkClick) {
                e.preventDefault();
                onSocialLinkClick(link.url, link.type);
              }
            }}
          >
            {link.icon ? (
              <span className="text-base">{link.icon}</span>
            ) : (
              <span className="text-[10px] font-semibold">{link.type}</span>
            )}
          </a>
        ))}
      </div>
    );
  };

  const renderContacts = () => {
    if (!data.contacts || Object.keys(data.contacts).length === 0) return null;
    return (
      <div
        className={cn(
          'mt-4 border-t pt-4',
          themeName === 'dark' ? 'border-gray-800' : 'border-gray-100',
        )}
      >
        {Object.entries(data.contacts).map(([type, value], index) => (
          <div
            key={index}
            className={cn(
              'mb-2 flex cursor-pointer rounded px-2 py-1.5 transition-colors',
              themeName === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-50',
            )}
            onClick={() => onContactClick && onContactClick(type, value)}
          >
            <span
              className={cn(
                'w-[70px] shrink-0 font-medium',
                themeName === 'dark' ? 'text-gray-400' : 'text-gray-500',
              )}
            >
              {type}:
            </span>
            <span className={themeName === 'dark' ? 'text-gray-200' : 'text-gray-800'}>{value}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={data.name}
      footer={null}
      typewriter={false}
      className={cn(themeStyles[themeName], className)}
    >
      <div className="flex gap-5 mb-5">
        {showAvatar && (
          <div
            className="shrink-0"
            onClick={onAvatarClick}
            style={{ cursor: onAvatarClick ? 'pointer' : 'default' }}
          >
            <Avatar
              className="border-2 border-[var(--sa2-primary,#19c8b9)]/20 shadow-sm"
              style={{ width: avatarSize, height: avatarSize }}
            >
              {data.avatar ? <AvatarImage src={data.avatar} alt={data.name} /> : null}
              <AvatarFallback className="text-xl">
                {data.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
        )}
        <div className="flex min-w-0 flex-1 flex-col justify-center">
          {data.title ? (
            <div
              className={cn(
                'mb-2 text-sm',
                themeName === 'dark' ? 'text-gray-400' : 'text-gray-500',
              )}
            >
              {data.title}
            </div>
          ) : null}
          {showSocial && renderSocialLinks()}
        </div>
      </div>

      {showBio && data.bio ? (
        <div
          className={cn(
            'mb-5 text-sm leading-relaxed',
            themeName === 'dark' ? 'text-gray-300' : 'text-gray-600',
          )}
        >
          <p>{data.bio}</p>
        </div>
      ) : null}

      {showContacts && renderContacts()}

      {data.customContent ? <div className="mt-5">{data.customContent}</div> : null}
    </Modal>
  );
};

export default ProfileModal;

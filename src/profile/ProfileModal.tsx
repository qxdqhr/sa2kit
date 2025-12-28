'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../components/Dialog';
import { Avatar, AvatarImage, AvatarFallback } from '../components/Avatar';
import { ProfileData, SocialLink } from './types';
import { cn } from '../utils';

const themeStyles = {
  light: "",
  dark: "bg-[#222] text-[#eee] border-[#444]",
  blue: "bg-[#f0f8ff] border-[#1890ff]/20",
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
  // 渲染社交媒体链接
  const renderSocialLinks = () => {
    if (!data.socialLinks || data.socialLinks.length === 0) return null;
    return (
      <div className="flex gap-3 mt-2">
        {data.socialLinks.map((link: SocialLink, index: number) => (
          <a
            key={index}
            href={link.url}
            className={cn(
              "w-8 h-8 flex items-center justify-center rounded-full no-underline transition-all hover:-translate-y-0.5",
              themeName === 'dark' ? "bg-gray-800 text-gray-200 hover:bg-gray-700" : "bg-gray-100 text-gray-800 hover:bg-gray-200"
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

  // 渲染联系方式
  const renderContacts = () => {
    if (!data.contacts || Object.keys(data.contacts).length === 0) return null;
    return (
      <div className={cn(
        "mt-4 border-t pt-4",
        themeName === 'dark' ? "border-gray-800" : "border-gray-100"
      )}>
        {Object.entries(data.contacts).map(([type, value], index) => (
          <div 
            key={index} 
            className={cn(
              "flex mb-2 cursor-pointer py-1.5 px-2 rounded transition-colors",
              themeName === 'dark' ? "hover:bg-gray-800" : "hover:bg-gray-50"
            )}
            onClick={() => onContactClick && onContactClick(type, value)}
          >
            <span className={cn(
              "font-medium w-[70px] shrink-0",
              themeName === 'dark' ? "text-gray-400" : "text-gray-500"
            )}>{type}:</span>
            <span className={themeName === 'dark' ? "text-gray-200" : "text-gray-800"}>{value}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent className={cn(
        "sm:max-w-[500px] p-0 overflow-hidden border-none shadow-2xl",
        themeStyles[themeName as keyof typeof themeStyles] || "",
        className
      )}>
        <div className="p-6">
          <div className="flex gap-5 mb-5">
            {showAvatar && (
              <div 
                className="shrink-0"
                onClick={onAvatarClick}
                style={{ cursor: onAvatarClick ? 'pointer' : 'default' }}
              >
                <Avatar className="border-2 border-primary/10 shadow-sm" style={{ width: avatarSize, height: avatarSize }}>
                  {data.avatar && <AvatarImage src={data.avatar} alt={data.name} className="object-cover" />}
                  <AvatarFallback className="text-xl">
                    {data.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
            )}
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <h2 className={cn(
                "text-2xl font-bold m-0 mb-1",
                themeName === 'dark' ? "text-white" : "text-gray-900"
              )}>{data.name}</h2>
              {data.title && <div className={cn(
                "text-sm mb-2",
                themeName === 'dark' ? "text-gray-400" : "text-gray-500"
              )}>{data.title}</div>}
              {showSocial && renderSocialLinks()}
            </div>
          </div>
          
          {showBio && data.bio && (
            <div className={cn(
              "mb-5 leading-relaxed text-sm",
              themeName === 'dark' ? "text-gray-300" : "text-gray-600"
            )}>
              <p>{data.bio}</p>
            </div>
          )}
          
          {showContacts && renderContacts()}
          
          {data.customContent && (
            <div className="mt-5">
              {data.customContent}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileModal;

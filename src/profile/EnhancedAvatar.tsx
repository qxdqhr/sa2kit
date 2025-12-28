'use client';

import React from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '../components/Avatar';
import { cn } from '../utils';

export interface EnhancedAvatarProps {
  src?: string;
  name?: string;
  size?: 'small' | 'medium' | 'large' | number;
  mood?: 'online' | 'offline' | 'away';
  statusText?: string;
  onClick?: () => void;
  className?: string;
}

const sizeMap = {
  small: 'h-8 w-8',
  medium: 'h-12 w-12',
  large: 'h-16 w-16',
};

const moodColors = {
  online: 'bg-green-500',
  offline: 'bg-gray-500',
  away: 'bg-yellow-500',
};

export const EnhancedAvatar: React.FC<EnhancedAvatarProps> = ({
  src,
  name,
  size = 'medium',
  mood = 'online',
  statusText,
  onClick,
  className,
}) => {
  const sizeClass = typeof size === 'string' ? sizeMap[size] : '';
  const customSizeStyle = typeof size === 'number' ? { width: size, height: size } : {};

  return (
    <div className={cn("relative inline-block", className)} onClick={onClick}>
      <Avatar className={cn(sizeClass, onClick && "cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all")} style={customSizeStyle}>
        {src && <AvatarImage src={src} alt={name || "Avatar"} className="object-cover" />}
        <AvatarFallback className="bg-primary/10 text-primary-foreground">
          {name ? name.substring(0, 2).toUpperCase() : '??'}
        </AvatarFallback>
      </Avatar>
      
      {mood && (
        <div
          className={cn(
            "absolute bottom-0 right-0 rounded-full border-2 border-white",
            moodColors[mood],
            typeof size === 'number' ? (size > 60 ? 'h-4 w-4' : 'h-3 w-3') : (size === 'large' ? 'h-4 w-4' : 'h-3 w-3')
          )}
        />
      )}
      
      {statusText && (
        <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
          <span className="text-xs text-muted-foreground">{statusText}</span>
        </div>
      )}
    </div>
  );
};

export default EnhancedAvatar;

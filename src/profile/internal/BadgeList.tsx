import React from 'react';
import { Badge } from '../../components/Badge';
import { cn } from '../../utils';
import { BadgeType } from '../types';
    
interface BadgeListProps {
    badges: BadgeType[];
    className?: string;
}

export const BadgeList: React.FC<BadgeListProps> = ({
    badges,
    className = '',
}) => {
    if (!badges || badges.length === 0) return null;

    return (
        <div className={cn("flex flex-wrap gap-2 mt-4", className)}>
            {badges.map((badge, index) => (
                <Badge 
                  key={index} 
                  variant={badge.type === 'default' ? 'default' : (badge.type as any)}
                >
                  {badge.icon && <span className="mr-1">{badge.icon}</span>}
                  {badge.label}
                </Badge>
            ))}
        </div>
    );
};

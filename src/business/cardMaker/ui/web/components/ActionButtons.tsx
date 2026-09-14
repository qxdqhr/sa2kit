'use client';

import React from 'react';

interface ActionButtonsProps {
  onConfigChange: () => void;
  onNameChange: () => void;
  onCommentEdit: () => void;
  onSave: () => void;
  isSaving?: boolean;
  className?: string;
}

const ActionButton: React.FC<{
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'default' | 'primary';
  disabled?: boolean;
  icon?: string;
}> = ({ onClick, children, variant = 'default', disabled = false, icon }) => {
  const baseStyle = {
    padding: '10px 20px',
    borderRadius: '24px',
    fontSize: '14px',
    fontWeight: '500',
    borderWidth: '2px',
    transition: 'all 200ms ease',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
  };

  const variantStyles =
    variant === 'primary'
      ? {
          backgroundColor: '#ff7849',
          borderColor: '#ff7849',
          color: '#ffffff',
          fontWeight: '700',
          boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
        }
      : {
          backgroundColor: '#ffffff',
          borderColor: '#e2e8f0',
          color: '#334155',
        };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{ ...baseStyle, ...variantStyles }}
      className={`flex items-center gap-2 ${variant === 'primary' ? 'hover:bg-orange-600 hover:shadow-lg' : 'hover:border-orange-300 hover:text-orange-600'} transition-all duration-200`}
    >
      {icon && <span style={{ fontSize: '16px' }}>{icon}</span>}
      {children}
    </button>
  );
};

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  onConfigChange,
  onNameChange,
  onCommentEdit,
  onSave,
  isSaving = false,
  className = '',
}) => {
  return (
    <div
      className={`bg-white flex flex-wrap justify-between ${className}`}
      style={{
        padding: '20px',
        gap: '12px',
      }}
    >
      <div className="flex flex-wrap flex-1" style={{ gap: '12px' }}>
        <ActionButton onClick={onConfigChange} icon="⚙️">
          配置変更
        </ActionButton>

        <ActionButton onClick={onNameChange}>名前変更</ActionButton>

        <ActionButton onClick={onCommentEdit}>コメント編集</ActionButton>
      </div>

      <ActionButton onClick={onSave} variant="primary" disabled={isSaving} icon="✓">
        {isSaving ? '保存中...' : '保存'}
      </ActionButton>
    </div>
  );
};

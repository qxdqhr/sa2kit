'use client';

import {
  Button as Sa2Button,
  type ButtonProps as Sa2ButtonProps,
} from '@sa2kit-ui/react';
import React, { type ReactNode } from 'react';

type ShadcnVariant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
type ShadcnSize = 'default' | 'sm' | 'lg' | 'icon';

export type ButtonProps = Omit<Sa2ButtonProps, 'type' | 'size'> & {
  type?: Sa2ButtonProps['type'];
  size?: Sa2ButtonProps['size'] | ShadcnSize;
  variant?: ShadcnVariant;
  children?: ReactNode;
};

function mapVariant(variant?: ShadcnVariant): Sa2ButtonProps['type'] {
  switch (variant) {
    case 'outline':
      return 'dashed';
    case 'ghost':
      return 'text';
    case 'link':
      return 'link';
    case 'destructive':
      return 'primary';
    case 'secondary':
      return 'default';
    case 'default':
    default:
      return 'primary';
  }
}

function mapSize(size?: ButtonProps['size']): Sa2ButtonProps['size'] {
  switch (size) {
    case 'sm':
    case 'small':
      return 'small';
    case 'lg':
    case 'large':
      return 'large';
    case 'icon':
      return 'middle';
    case 'middle':
      return 'middle';
    default:
      return 'middle';
  }
}

/** 动森 Button，兼容 shadcn variant/size 命名（showmasterpiece 迁移用） */
export function Button({
  variant,
  type,
  size,
  danger,
  children,
  ...rest
}: ButtonProps) {
  const resolvedType = type ?? mapVariant(variant);
  const resolvedDanger = danger ?? variant === 'destructive';
  return (
    <Sa2Button
      type={resolvedType}
      size={mapSize(size)}
      danger={resolvedDanger}
      {...rest}
    >
      {children}
    </Sa2Button>
  );
}

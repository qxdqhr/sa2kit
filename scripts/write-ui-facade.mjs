#!/usr/bin/env node
/**
 * tsup 对 `export * from '@sa2kit-ui/*'`（external）会打出空 chunk。
 * 构建后写入手写门面，保证 `sa2kit/common/ui` / `sa2kit/common/ui/rn` 再导出可用。
 *
 * 必须用显式 named re-export（勿 export *）：Next/webpack 对 CJS 互操作会丢命名导出。
 *
 * RN types：自包含声明，避免 link 包 realpath 下解析不到 peer、或把 rn 源码拉进宿主 tsc。
 * 运行时仍走 `src/common/ui/rn`（Metro transpile）。
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'dist/common/ui');
const rnOutDir = join(outDir, 'rn');

mkdirSync(outDir, { recursive: true });
mkdirSync(rnOutDir, { recursive: true });

const NAMED_VALUES = [
  'Button',
  'Input',
  'Switch',
  'Card',
  'Typewriter',
  'Modal',
  'Title',
  'Tabs',
  'Collapse',
  'Checkbox',
  'Radio',
  'Tooltip',
  'Select',
  'Loading',
  'Divider',
  'Time',
  'CodeBlock',
  'Table',
  'Icon',
  'ICON_LIST',
  'ITEM_COUNT',
  'ITEM_LIST',
  'ITEM_URL_MAP',
  'Footer',
  'Phone',
  'Cursor',
  'Wallet',
  'WeddingInvitation',
  'WeddingInvitationExportButton',
  'ThemeProvider',
  'useTheme',
  'SA2_THEMES',
];

const NAMED_TYPES = [
  'ButtonProps',
  'ButtonType',
  'ButtonSize',
  'ButtonHTMLType',
  'InputProps',
  'InputSize',
  'SwitchProps',
  'SwitchSize',
  'CardProps',
  'CardType',
  'CardColor',
  'ModalProps',
  'TitleProps',
  'TitleSize',
  'TitleColor',
  'TabsProps',
  'TabItem',
  'CollapseProps',
  'CheckboxProps',
  'CheckboxOption',
  'CheckboxSize',
  'RadioProps',
  'RadioOption',
  'RadioSize',
  'TypewriterProps',
  'TooltipProps',
  'TooltipPlacement',
  'TooltipTrigger',
  'TooltipVariant',
  'SelectProps',
  'SelectOption',
  'LoadingProps',
  'DividerProps',
  'DividerType',
  'TimeProps',
  'CodeBlockProps',
  'TableProps',
  'TableColumn',
  'IconProps',
  'IconName',
  'FooterProps',
  'FooterType',
  'PhoneProps',
  'CursorProps',
  'WalletProps',
  'WalletSize',
  'WeddingInvitationProps',
  'WeddingInvitationRef',
  'WeddingInvitationExportButtonProps',
  'Sa2ThemeId',
  'ThemeContextValue',
  'ThemeProviderProps',
];

const esm = `export {
  ${NAMED_VALUES.join(',\n  ')},
} from '@sa2kit-ui/react';
export type {
  ${NAMED_TYPES.join(',\n  ')},
} from '@sa2kit-ui/react';
`;

const cjs = `"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
  if (k2 === undefined) k2 = k;
  var desc = Object.getOwnPropertyDescriptor(m, k);
  if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
    desc = { enumerable: true, get: function() { return m[k]; } };
  }
  Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
  if (k2 === undefined) k2 = k;
  o[k2] = m[k];
}));
Object.defineProperty(exports, "__esModule", { value: true });
var react = require("@sa2kit-ui/react");
${NAMED_VALUES.map((name) => `__createBinding(exports, react, "${name}");`).join('\n')}
`;

const dts = esm;

writeFileSync(join(outDir, 'index.mjs'), esm);
writeFileSync(join(outDir, 'index.js'), cjs);
writeFileSync(join(outDir, 'index.d.ts'), dts);
writeFileSync(join(outDir, 'index.d.mts'), dts);

console.log('✓ wrote dist/common/ui facade → @sa2kit-ui/react (named exports)');

const rnModalDts = `import type { ReactNode } from 'react';

export type ModalProps = {
  open?: boolean;
  visible?: boolean;
  title?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  maskClosable?: boolean;
  dismissOnBackdrop?: boolean;
  typewriter?: boolean;
  onClose?: () => void;
  className?: string;
};

export declare function Modal(props: ModalProps): ReactNode;
export declare function ModalCancelButton(props: {
  onPress: () => void;
  disabled?: boolean;
  label?: string;
}): ReactNode;
export declare function ModalPrimaryButton(props: {
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  danger?: boolean;
  label?: string;
}): ReactNode;
`;

const rnInputDts = `import type { ReactNode } from 'react';
import type { StyleProp, TextStyle } from 'react-native';

export type InputProps = {
  size?: 'small' | 'middle' | 'large';
  prefix?: ReactNode;
  suffix?: ReactNode;
  allowClear?: boolean;
  status?: 'error' | 'warning';
  shadow?: boolean;
  disabled?: boolean;
  editable?: boolean;
  className?: string;
  style?: StyleProp<TextStyle>;
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  multiline?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: string;
  autoCorrect?: boolean;
  secureTextEntry?: boolean;
  onChange?: (value: string) => void;
  onChangeText?: (text: string) => void;
  onClear?: () => void;
};

export declare function Input(props: InputProps): ReactNode;
`;

const rnLoadingDts = `import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

export type HostLoadingProps = {
  active?: boolean;
  fullScreen?: boolean;
  className?: string;
  style?: StyleProp<ViewStyle>;
};

export declare function Loading(props: HostLoadingProps): ReactNode;
`;

const rnIndexDts = `import type { ComponentType, ReactNode } from 'react';

export type ButtonType = 'primary' | 'default' | 'dashed' | 'text' | 'link';
export type ButtonSize = 'small' | 'middle' | 'large';
export type TitleSize = 'small' | 'middle' | 'large';
export type TitleColor =
  | 'default'
  | 'primary'
  | 'success'
  | 'warning'
  | 'error'
  | 'app-teal'
  | 'app-orange'
  | 'app-pink'
  | 'app-blue'
  | 'app-purple'
  | 'app-yellow'
  | 'app-green'
  | string;

export type ButtonProps = {
  type?: ButtonType;
  size?: ButtonSize;
  danger?: boolean;
  ghost?: boolean;
  block?: boolean;
  loading?: boolean;
  disabled?: boolean;
  children?: ReactNode;
  className?: string;
  onPress?: () => void;
};

export type TitleProps = {
  size?: TitleSize;
  color?: TitleColor;
  children?: ReactNode;
  className?: string;
};

export type CardProps = {
  type?: string;
  color?: string;
  children?: ReactNode;
  className?: string;
  style?: object;
  onPress?: () => void;
};

export declare const Button: ComponentType<ButtonProps>;
export declare const Card: ComponentType<CardProps>;
export declare const Title: ComponentType<TitleProps>;
export declare const Switch: ComponentType<Record<string, unknown>>;
export declare const Tabs: ComponentType<Record<string, unknown>>;
export declare const Collapse: ComponentType<Record<string, unknown>>;
export declare const Checkbox: ComponentType<Record<string, unknown>>;
export declare const Radio: ComponentType<Record<string, unknown>>;
export declare const Typewriter: ComponentType<Record<string, unknown>>;
export declare const Tooltip: ComponentType<Record<string, unknown>>;
export declare const Select: ComponentType<Record<string, unknown>>;
export declare const Divider: ComponentType<Record<string, unknown>>;
export declare const Time: ComponentType<Record<string, unknown>>;
export declare const CodeBlock: ComponentType<Record<string, unknown>>;
export declare const Table: ComponentType<Record<string, unknown>>;
export declare const Icon: ComponentType<Record<string, unknown>>;
export declare const Footer: ComponentType<Record<string, unknown>>;
export declare const Phone: ComponentType<Record<string, unknown>>;
export declare const Cursor: ComponentType<Record<string, unknown>>;
export declare const Wallet: ComponentType<Record<string, unknown>>;
export declare const WeddingInvitation: ComponentType<Record<string, unknown>>;
export declare const WeddingInvitationExportButton: ComponentType<Record<string, unknown>>;
export declare const ICON_LIST: readonly string[];
export declare const ITEM_LIST: readonly string[];
export declare const ITEM_URL_MAP: Record<string, string>;
export declare const ITEM_COUNT: number;

export { Modal, ModalCancelButton, ModalPrimaryButton } from './Modal';
export type { ModalProps } from './Modal';
export { Loading } from './Loading';
export type { HostLoadingProps } from './Loading';
export { Input } from './Input';
export type { InputProps } from './Input';
`;

writeFileSync(join(rnOutDir, 'Modal.d.ts'), rnModalDts);
writeFileSync(join(rnOutDir, 'Input.d.ts'), rnInputDts);
writeFileSync(join(rnOutDir, 'Loading.d.ts'), rnLoadingDts);
writeFileSync(join(rnOutDir, 'index.d.ts'), rnIndexDts);
writeFileSync(join(rnOutDir, 'index.d.mts'), rnIndexDts);

console.log('✓ wrote dist/common/ui/rn types facade (self-contained)');

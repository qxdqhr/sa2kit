'use client';

/**
 * 管理台 / 迁移兼容层：动森视觉 + 兼容旧 shadcn 复合 API。
 * 新代码优先用 `sa2kit/common/ui` 的声明式 API（items 式 Tabs/Select）。
 */
export { Card, Title, Loading, Footer, Switch, Divider, Cursor } from '@sa2kit-ui/react';

export { Button } from './Button';
export { Modal } from './Modal';
export { ConfirmModal } from './ConfirmModal';
export type { ConfirmModalProps } from './ConfirmModal';
export { Input } from './Input';
export { Label } from './Label';
export { Textarea } from './Textarea';
export { Badge } from './Badge';
export {
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from './CardSlots';
export { Tabs, TabsList, TabsTrigger, TabsContent } from './TabsCompound';
export {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from './SelectCompound';

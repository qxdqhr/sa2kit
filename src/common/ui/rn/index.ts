/**
 * sa2kit RN UI 门面：再导出 @sa2kit-ui/rn + 宿主兼容适配。
 * 样式：宿主需引入 `@sa2kit-ui/theme-animal-island/theme.mobile.css` 并配置 tailwind preset。
 */
export {
  Button,
  Switch,
  Card,
  Title,
  Tabs,
  Collapse,
  Checkbox,
  Radio,
  Typewriter,
  Tooltip,
  Select,
  Divider,
  Time,
  CodeBlock,
  Table,
  Icon,
  ICON_LIST,
  ITEM_LIST,
  ITEM_URL_MAP,
  ITEM_COUNT,
  Footer,
  Phone,
  Cursor,
  Wallet,
  WeddingInvitation,
  WeddingInvitationExportButton,
} from '@sa2kit-ui/rn';

export type {
  ButtonProps,
  ButtonType,
  ButtonSize,
  SwitchProps,
  SwitchSize,
  MobileInputProps,
  MobileCardProps,
  ModalProps as Sa2ModalProps,
  TitleProps,
  TitleSize,
  TitleColor,
  TabsProps,
  CollapseProps,
  CheckboxProps,
  RadioProps,
  TypewriterProps,
  TooltipProps,
  SelectProps,
  LoadingProps,
  DividerProps,
  TimeProps,
  CodeBlockProps,
  TableProps,
  IconProps,
  FooterProps,
  PhoneProps,
  CursorProps,
  WalletProps,
  WeddingInvitationProps,
} from '@sa2kit-ui/rn';

export { Modal, ModalCancelButton, ModalPrimaryButton } from './Modal';
export type { ModalProps } from './Modal';
export { Loading } from './Loading';
export { Input } from './Input';

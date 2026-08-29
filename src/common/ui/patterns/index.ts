/**
 * 模式件（BackButton / SearchBox 等）：动森视觉，无业务路由耦合。
 * 后续可整体迁入 sa2kit-ui；过渡期经本入口与 common/components 再导出。
 */
export { BackButton, type BackButtonProps } from './BackButton';
export { SearchBox, type SearchBoxProps } from './SearchBox';
export { SearchResultHint, type SearchResultHintProps } from './SearchResultHint';
export {
  FilterButtonGroup,
  type FilterButtonGroupProps,
  type FilterOption,
} from './FilterButtonGroup';
export { Avatar, AvatarImage, AvatarFallback } from './Avatar';

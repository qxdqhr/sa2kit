import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** UI 门面自包含 cn，避免发布包缺少 src/common/utils 时相对路径断裂 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

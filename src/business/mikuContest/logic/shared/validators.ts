import type { CreateMikuSubmissionInput, MikuWorkType } from '../../types';

const DESCRIPTION_LIMIT = 500;
const MINIAPP_DESCRIPTION_LIMIT = 200;
const TEXT_CONTENT_LIMIT = 2000;
const MAX_TAGS = 3;

const hasValue = (value: unknown): boolean => {
  return typeof value === 'string' ? value.trim().length > 0 : value !== null && value !== undefined;
};

const validateByType = (type: MikuWorkType, input: CreateMikuSubmissionInput): string[] => {
  const errors: string[] = [];
  const { content } = input;

  switch (type) {
    case 'visual': {
      const imageCount = content.images?.length || 0;
      if (imageCount < 1 || imageCount > 3) {
        errors.push('视觉类作品需上传 1-3 张图片');
      }
      break;
    }
    case 'video': {
      if (!hasValue(content.videoLink)) {
        errors.push('视频类作品需提供视频链接');
      }
      if (!hasValue(content.coverImage)) {
        errors.push('视频类作品需提供封面图');
      }
      break;
    }
    case 'text': {
      const text = content.textContent || '';
      if (!text.trim()) {
        errors.push('文字类作品需填写正文');
      }
      if (text.length > TEXT_CONTENT_LIMIT) {
        errors.push(`文字正文不能超过 ${TEXT_CONTENT_LIMIT} 字`);
      }
      break;
    }
    case 'audio': {
      if (!hasValue(content.audioLink)) {
        errors.push('音频类作品需提供音频链接');
      }
      break;
    }
    default:
      break;
  }

  return errors;
};

export const validateMikuSubmissionInput = (
  input: CreateMikuSubmissionInput,
  mode: 'web' | 'miniapp' = 'web',
): string[] => {
  const errors: string[] = [];

  if (!input.contestId.trim()) errors.push('contestId 不能为空');
  if (!input.authorId.trim()) errors.push('authorId 不能为空');
  if (!input.authorNickname.trim()) errors.push('作者昵称不能为空');
  if (!input.title.trim()) errors.push('作品名称不能为空');

  const descriptionLimit = mode === 'miniapp' ? MINIAPP_DESCRIPTION_LIMIT : DESCRIPTION_LIMIT;
  if (input.description.length > descriptionLimit) {
    errors.push(`作品简介不能超过 ${descriptionLimit} 字`);
  }

  if ((input.tags?.length || 0) > MAX_TAGS) {
    errors.push(`标签最多 ${MAX_TAGS} 个`);
  }

  errors.push(...validateByType(input.type, input));
  return errors;
};

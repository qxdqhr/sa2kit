import type { AiMediaInput } from './types';
import { assertValidAudioInput } from './audioUtils';
import { assertValidImageInput } from './imageUtils';

export function splitMediaByKind(media: AiMediaInput[]): {
  images: AiMediaInput[];
  audios: AiMediaInput[];
} {
  const images: AiMediaInput[] = [];
  const audios: AiMediaInput[] = [];
  for (const item of media) {
    if (item.kind === 'image') {
      images.push(item);
    } else {
      audios.push(item);
    }
  }
  return { images, audios };
}

export function assertValidMultimodalMedia(
  media: AiMediaInput[] | undefined,
  limits: { maxImageBytes: number; maxAudioBytes: number; maxImages?: number; maxAudios?: number }
): AiMediaInput[] {
  const items = media ?? [];
  const { images, audios } = splitMediaByKind(items);

  const maxImages = limits.maxImages ?? 8;
  const maxAudios = limits.maxAudios ?? 4;

  if (images.length > maxImages) {
    throw new Error(`图片数量过多，最多 ${maxImages} 张`);
  }
  if (audios.length > maxAudios) {
    throw new Error(`音频数量过多，最多 ${maxAudios} 段`);
  }

  for (const image of images) {
    assertValidImageInput(
      { base64: image.base64, mimeType: image.mimeType },
      limits.maxImageBytes
    );
  }
  for (const audio of audios) {
    assertValidAudioInput(
      { base64: audio.base64, mimeType: audio.mimeType },
      limits.maxAudioBytes
    );
  }

  return items;
}

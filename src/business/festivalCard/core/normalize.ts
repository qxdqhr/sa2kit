import { DEFAULT_FESTIVAL_CARD_CONFIG } from './defaults';
import type { FestivalCardConfig, FestivalCardPage } from '../types';

const ensurePage = (page: FestivalCardPage, index: number): FestivalCardPage => ({
  id: page.id || `page-${index + 1}`,
  title: page.title || `第 ${index + 1} 页`,
  elements: Array.isArray(page.elements) ? page.elements : [],
  background: page.background || {},
});

export const normalizeFestivalCardConfig = (
  config?: Partial<FestivalCardConfig> | null
): FestivalCardConfig => {
  const pages = config?.pages && config.pages.length > 0 ? config.pages : DEFAULT_FESTIVAL_CARD_CONFIG.pages;

  return {
    ...DEFAULT_FESTIVAL_CARD_CONFIG,
    ...config,
    background: {
      ...DEFAULT_FESTIVAL_CARD_CONFIG.background,
      ...(config?.background || {}),
    },
    backgroundMusic: {
      ...DEFAULT_FESTIVAL_CARD_CONFIG.backgroundMusic,
      ...(config?.backgroundMusic || {}),
      src: config?.backgroundMusic?.src ?? DEFAULT_FESTIVAL_CARD_CONFIG.backgroundMusic?.src ?? '',
    },
    pages: pages.map(ensurePage),
  };
};

export const resizeFestivalCardPages = (config: FestivalCardConfig, pageCount: number): FestivalCardConfig => {
  const safeCount = Math.max(1, Math.min(12, Math.floor(pageCount || 1)));
  const nextPages = [...config.pages];

  while (nextPages.length < safeCount) {
    const idx = nextPages.length;
    nextPages.push({
      id: `page-${idx + 1}`,
      title: `第 ${idx + 1} 页`,
      elements: [],
      background: {},
    });
  }

  return {
    ...config,
    pages: nextPages.slice(0, safeCount),
  };
};

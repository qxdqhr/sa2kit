/** 站点配置 normalize（供 server basicDbService 使用） */

export type CollectionCategoryType = string;

export interface MiniappFloatingButtonsConfig {
  showCart: boolean;
  showHistory: boolean;
  showAddToCart: boolean;
}

export interface HomeTabConfigItem {
  name?: string;
  description?: string | null;
  category: CollectionCategoryType;
  visible: boolean;
  order: number;
}

export function buildDefaultHomeTabConfig(): HomeTabConfigItem[] {
  return [];
}

export function normalizeHomeTabConfig(
  input?: HomeTabConfigItem[] | null,
): HomeTabConfigItem[] {
  if (!input || input.length === 0) {
    return [];
  }

  const filtered = input
    .filter((item) => {
      if (!item) {
        return false;
      }
      const rawName = typeof item.name === 'string' ? item.name : item.category;
      return typeof rawName === 'string' && rawName.trim().length > 0;
    })
    .map((item) => {
      const rawName = typeof item.name === 'string' ? item.name : item.category;
      const name = typeof rawName === 'string' ? rawName.trim() : '';
      const description =
        typeof item.description === 'string' ? item.description.trim() : item.description;

      return {
        name,
        description: description && description.length > 0 ? description : null,
        category: name as CollectionCategoryType,
        visible: item.visible ?? true,
        order: Number.isFinite(item.order) ? Number(item.order) : 0,
      };
    });

  if (filtered.length === 0) {
    return [];
  }

  filtered.sort((a, b) => a.order - b.order);
  const normalized = filtered.map((item, index) => ({ ...item, order: index }));

  if (!normalized.some((item) => item.visible)) {
    const firstItem = normalized[0];
    if (firstItem) {
      normalized[0] = { ...firstItem, visible: true };
    }
  }

  return normalized;
}

export const defaultMiniappFloatingButtonsConfig: MiniappFloatingButtonsConfig = {
  showCart: true,
  showHistory: true,
  showAddToCart: true,
};

export function normalizeMiniappFloatingButtonsConfig(
  input?: Partial<MiniappFloatingButtonsConfig> | null,
): MiniappFloatingButtonsConfig {
  return {
    showCart: input?.showCart ?? true,
    showHistory: input?.showHistory ?? true,
    showAddToCart: input?.showAddToCart ?? true,
  };
}

export const formatPrice = (price?: number | null): string => {
  if (!price) return '价格待定';
  return `¥${price}`;
};

declare const wx: any;

const hasWxStorage = (): boolean =>
  typeof wx !== 'undefined' && typeof (wx as any).getStorageSync === 'function';

const hasLocalStorage = (): boolean =>
  typeof localStorage !== 'undefined' && typeof localStorage.getItem === 'function';

export const getStorageSync = <T>(key: string): T | null => {
  try {
    if (hasWxStorage()) {
      return (wx as any).getStorageSync(key) as T;
    }
    if (hasLocalStorage()) {
      const value = localStorage.getItem(key);
      return value ? (JSON.parse(value) as T) : null;
    }
  } catch {
    return null;
  }
  return null;
};

export const setStorageSync = (key: string, value: unknown): void => {
  try {
    if (hasWxStorage()) {
      (wx as any).setStorageSync(key, value);
      return;
    }
    if (hasLocalStorage()) {
      localStorage.setItem(key, JSON.stringify(value));
    }
  } catch {
    // ignore
  }
};

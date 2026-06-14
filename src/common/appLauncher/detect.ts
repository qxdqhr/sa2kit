export function isAndroid(userAgent = getUserAgent()): boolean {
  return /Android/i.test(userAgent);
}

export function isIOS(userAgent = getUserAgent()): boolean {
  return /iPhone|iPad|iPod/i.test(userAgent);
}

export function isMobileDevice(userAgent = getUserAgent()): boolean {
  return isAndroid(userAgent) || isIOS(userAgent);
}

function getUserAgent(): string {
  if (typeof navigator === 'undefined') {
    return '';
  }
  return navigator.userAgent;
}

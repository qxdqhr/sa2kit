import type { ARJSLoadOptions, THREExNamespace } from './types';

let loadPromise: Promise<THREExNamespace> | null = null;

export async function loadARJS(options: ARJSLoadOptions = {}): Promise<THREExNamespace> {
  if (typeof window === 'undefined') {
    throw new Error('AR.js can only be loaded in a browser environment.');
  }

  if (options.three) {
    (window as any).THREE = options.three;
  }

  const existing = (window as any).THREEx as THREExNamespace | undefined;
  if (existing && !options.forceReload) {
    return existing;
  }

  if (!loadPromise || options.forceReload) {
    const importPromise = options.locationOnly
      ? import('@ar-js-org/ar.js/three.js/build/ar-threex-location-only.js')
      : import('@ar-js-org/ar.js/three.js/build/ar-threex.js');

    loadPromise = importPromise.then(() => {
      const THREEx = (window as any).THREEx as THREExNamespace | undefined;
      if (!THREEx) {
        throw new Error('AR.js loaded, but THREEx namespace was not found.');
      }
      return THREEx;
    });
  }

  return loadPromise;
}

import type { ARJSLoadOptions, THREExNamespace } from './types';

let loadPromise: Promise<THREExNamespace> | null = null;

type ARWindow = Window & {
  THREE?: unknown;
  THREEx?: unknown;
  ARjs?: unknown;
};

function isTHREExNamespace(value: unknown): value is THREExNamespace {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.ArToolkitSource === 'function' &&
    typeof candidate.ArToolkitContext === 'function' &&
    typeof candidate.ArMarkerControls === 'function'
  );
}

function resolveTHREExNamespace(moduleExports: unknown): THREExNamespace | undefined {
  const arWindow = window as ARWindow;
  const globalTHREEx = arWindow.THREEx;
  if (isTHREExNamespace(globalTHREEx)) {
    return globalTHREEx;
  }

  if (isTHREExNamespace(moduleExports)) {
    return moduleExports;
  }

  const record = moduleExports as Record<string, unknown> | undefined;
  const defaultExport = record?.default;

  if (isTHREExNamespace(defaultExport)) {
    return defaultExport;
  }

  if (isTHREExNamespace(record?.THREEx)) {
    return record?.THREEx as THREExNamespace;
  }

  const arjsCandidate = record?.ARjs ?? defaultExport ?? record ?? arWindow.ARjs;
  const arjsRecord = arjsCandidate as Record<string, unknown> | undefined;
  const source = arjsRecord?.Source;
  const context = arjsRecord?.Context;
  const markerControls = arjsRecord?.MarkerControls;
  if (
    typeof source === 'function' &&
    typeof context === 'function' &&
    typeof markerControls === 'function'
  ) {
    return {
      ArToolkitSource: source as THREExNamespace['ArToolkitSource'],
      ArToolkitContext: context as THREExNamespace['ArToolkitContext'],
      ArMarkerControls: markerControls as THREExNamespace['ArMarkerControls']
    };
  }

  return undefined;
}

export async function loadARJS(options: ARJSLoadOptions = {}): Promise<THREExNamespace> {
  if (typeof window === 'undefined') {
    throw new Error('AR.js can only be loaded in a browser environment.');
  }

  if (options.three) {
    (window as ARWindow).THREE = options.three;
  }

  const existing = (window as ARWindow).THREEx;
  if (existing && !options.forceReload) {
    if (isTHREExNamespace(existing)) {
      return existing;
    }
  }

  if (!loadPromise || options.forceReload) {
    const importPromise: Promise<unknown> = options.locationOnly
      ? import('@ar-js-org/ar.js/three.js/build/ar-threex-location-only.js')
      : import('@ar-js-org/ar.js/three.js/build/ar-threex.js');

    loadPromise = importPromise.then((loadedModule) => {
      const THREEx = resolveTHREExNamespace(loadedModule);
      if (!THREEx) {
        throw new Error('AR.js loaded, but THREEx namespace was not found in module exports or window.');
      }
      (window as ARWindow).THREEx = THREEx;
      return THREEx;
    });
  }

  return loadPromise;
}

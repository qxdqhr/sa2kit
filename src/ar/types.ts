import type * as THREE from 'three';

export interface ARToolkitSource {
  ready: boolean;
  domElement: HTMLVideoElement;
  init: (onReady?: () => void, onError?: (error: unknown) => void) => void;
  onResizeElement?: () => void;
  copyElementSizeTo?: (element: HTMLElement) => void;
  dispose?: () => void;
}

export interface ARToolkitContext {
  init: (onReady?: () => void) => void;
  update: (element: HTMLVideoElement) => void;
  getProjectionMatrix: () => THREE.Matrix4;
  arController?: { canvas?: HTMLCanvasElement } | null;
}

export interface ARMarkerControls {
  dispose?: () => void;
}

export interface THREExNamespace {
  ArToolkitSource: new (config: Record<string, any>) => ARToolkitSource;
  ArToolkitContext: new (config: Record<string, any>) => ARToolkitContext;
  ArMarkerControls: new (
    context: ARToolkitContext,
    markerRoot: THREE.Object3D,
    config: Record<string, any>
  ) => ARMarkerControls;
}

export interface ARJSLoadOptions {
  three?: typeof THREE;
  forceReload?: boolean;
  locationOnly?: boolean;
}

export interface ARMarkerConfig {
  type?: 'pattern' | 'barcode' | 'unknown';
  patternUrl?: string;
  barcodeValue?: number;
  changeMatrixMode?: 'modelViewMatrix' | 'cameraTransformMatrix';
}

export interface ARToolkitContextConfig {
  cameraParametersUrl?: string;
  detectionMode?: 'mono' | 'mono_and_matrix' | 'color';
  maxDetectionRate?: number;
}

export const DEFAULT_AR_ASSETS = {
  cameraParametersUrl:
    'https://raw.githack.com/AR-js-org/AR.js/master/three.js/data/camera_para.dat',
  patternUrl: 'https://raw.githack.com/AR-js-org/AR.js/master/three.js/data/patt.hiro',
};

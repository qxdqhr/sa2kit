declare module '@ar-js-org/ar.js/three.js/build/ar-threex-location-only.js' {
  export interface DeviceOrientationControls {
    connect(): void;
    disconnect(): void;
    update(): void;
    dispose(): void;
    enabled: boolean;
  }

  export interface LocationBased {
    constructor(scene: any, camera: any, options?: any);
    startGps(maximumAge?: number): boolean;
    stopGps(): boolean;
    fakeGps(longitude: number, latitude: number, elevation?: number | null, accuracy?: number): void;
    lonLatToWorldCoords(longitude: number, latitude: number): [number, number];
    add(object: any, longitude: number, latitude: number, elevation?: number): void;
    setWorldPosition(object: any, longitude: number, latitude: number, elevation?: number): void;
    setElevation(elevation: number): void;
    on(event: string, handler: Function): void;
  }

  export interface WebcamRenderer {
    constructor(renderer: any, videoElement?: string);
    update(): void;
    dispose(): void;
  }

  export const THREEx: {
    DeviceOrientationControls: new (object: any) => DeviceOrientationControls;
    LocationBased: new (scene: any, camera: any, options?: any) => LocationBased;
    WebcamRenderer: new (renderer: any, videoElement?: string) => WebcamRenderer;
  };

  export default THREEx;
}
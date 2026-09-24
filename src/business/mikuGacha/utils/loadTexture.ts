import * as THREE from 'three';

const cache = new Map<string, THREE.Texture>();
const loader = new THREE.TextureLoader();

export function loadTexture(url: string): Promise<THREE.Texture> {
  const hit = cache.get(url);
  if (hit) {
    return Promise.resolve(hit);
  }

  return new Promise((resolve, reject) => {
    loader.load(
      url,
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = 4;
        cache.set(url, texture);
        resolve(texture);
      },
      undefined,
      (err) => {
        reject(err instanceof Error ? err : new Error(`Failed to load texture: ${url}`));
      },
    );
  });
}

export function clearTextureCache(): void {
  for (const tex of cache.values()) {
    tex.dispose();
  }
  cache.clear();
}

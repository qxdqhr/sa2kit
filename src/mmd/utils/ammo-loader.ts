let ammoPromise: Promise<void> | null = null;

export const loadAmmo = (): Promise<void> => {
  if (ammoPromise) {
    return ammoPromise;
  }

  ammoPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      resolve(); // SSR support
      return;
    }

    if ((window as any).Ammo) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    // Using a stable CDN for Ammo.js. 
    // Note: MMDPhysics in three.js typically expects the WASM version.
    // We'll use the one compatible with three.js examples.
    script.src = 'https://unpkg.com/three@0.154.0/examples/jsm/libs/ammo.wasm.js';
    script.async = true;

    script.onload = () => {
      // After script load, we need to wait for the WASM initialization
      const checkAmmo = () => {
        if (typeof (window as any).Ammo === 'function') {
             (window as any).Ammo().then(() => {
                resolve();
             });
        } else {
           // Sometimes it might be already initialized or different structure depending on the build
           // But standard ammo.wasm.js returns a promise-like factory
           if((window as any).Ammo) {
               resolve();
           } else {
               setTimeout(checkAmmo, 100);
           }
        }
      };
      checkAmmo();
    };

    script.onerror = (e) => {
      reject(new Error('Failed to load Ammo.js: ' + e));
      ammoPromise = null;
    };

    document.body.appendChild(script);
  });

  return ammoPromise;
};


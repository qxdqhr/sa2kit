
/**
 * Ammo.js 加载器
 * 用于异步加载 Ammo.js 物理引擎 (WASM 版本)
 */

// 声明全局 Ammo 对象
declare global {
  interface Window {
    Ammo: any;
  }
}

let ammoPromise: Promise<any> | null = null;

/**
 * 加载 Ammo.js
 * @param path Ammo.js (WASM wrapper) 的路径，默认为 '/libs/ammo.wasm.js'
 */
export const loadAmmo = (path: string = '/libs/ammo.wasm.js'): Promise<any> => {
  if (ammoPromise) {
    return ammoPromise;
  }

  ammoPromise = new Promise((resolve, reject) => {
    // 如果已经加载过
    if (typeof window.Ammo === 'function') {
      // Ammo 已经是一个函数（初始化器），直接调用
      window.Ammo().then((lib: any) => {
        resolve(lib);
      });
      return;
    }

    if (typeof window.Ammo === 'object') {
       // 已经初始化完毕
       resolve(window.Ammo);
       return;
    }

    const script = document.createElement('script');
    script.src = path;
    script.async = true;

    script.onload = () => {
      if (typeof window.Ammo === 'function') {
        // 初始化 Ammo
        window.Ammo().then((lib: any) => {
          // 某些版本的 ammo.js 初始化后会返回 lib 实例
          // 但也可能需要直接使用全局对象，这里做一个兼容
          resolve(lib || window.Ammo);
        }).catch((err: any) => {
          console.error('Ammo initialization failed:', err);
          reject(err);
        });
      } else {
        reject(new Error('Ammo.js loaded but window.Ammo is not a function'));
      }
    };

    script.onerror = (err) => {
      console.error('Failed to load Ammo.js script:', err);
      reject(new Error('Failed to load Ammo.js from ' + (path)));
    };

    document.body.appendChild(script);
  });

  return ammoPromise;
};


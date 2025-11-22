let ammoPromise: Promise<void> | null = null;

export interface AmmoConfig {
  /** Ammo.js 脚本路径（例如：'/mikutalking/libs/ammo.wasm.js'） */
  scriptPath: string;
  /** Ammo WASM 文件的基础路径（例如：'/mikutalking/libs/'） */
  wasmBasePath: string;
}

/**
 * 加载 Ammo.js 物理引擎
 * @param config Ammo.js 配置，包含脚本路径和 WASM 基础路径
 */
export const loadAmmo = (config: AmmoConfig): Promise<void> => {
  // 每次调用都重新检查配置，如果配置变了就重新加载
  const configKey = `${config.scriptPath}|${config.wasmBasePath}`;
  const currentConfigKey = (window as any).__AMMO_CONFIG_KEY__;

  // 如果已经加载过且配置相同，直接返回
  if (ammoPromise && currentConfigKey === configKey) {
    return ammoPromise;
  }

  // 配置变了，重置 promise
  if (currentConfigKey && currentConfigKey !== configKey) {
    ammoPromise = null;
    (window as any).Ammo = undefined;
  }

  ammoPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      resolve(); // SSR support
      return;
    }

    if ((window as any).Ammo && currentConfigKey === configKey) {
      console.log('✅ [Ammo] 已加载，直接使用');
      resolve();
      return;
    }

    console.log('📦 [Ammo] 开始加载 Ammo.js...');
    console.log('📂 [Ammo] 脚本路径:', config.scriptPath);
    console.log('📂 [Ammo] WASM 基础路径:', config.wasmBasePath);

    // 保存当前配置
    (window as any).__AMMO_CONFIG_KEY__ = configKey;
    
    // 设置 Ammo 配置，指定 WASM 文件路径
    (window as any).AMMO_PATH = config.wasmBasePath;
    
    const script = document.createElement('script');
    script.src = config.scriptPath;
    script.async = true;

    script.onload = () => {
      console.log('✅ [Ammo] 脚本加载完成，等待初始化...');
      // After script load, we need to wait for the WASM initialization
      const checkAmmo = () => {
        if (typeof (window as any).Ammo === 'function') {
          console.log('🔄 [Ammo] 开始初始化 WASM...');
          (window as any).Ammo({
            locateFile: (path: string) => {
              console.log('📍 [Ammo] 定位文件:', path);
              if (path.endsWith('.wasm')) {
                return config.wasmBasePath + path;
              }
              return path;
            }
          }).then((AmmoLib: any) => {
            console.log('✅ [Ammo] 初始化完成！');
            (window as any).Ammo = AmmoLib;
            resolve();
          }).catch((err: any) => {
            console.error('❌ [Ammo] 初始化失败:', err);
            reject(err);
          });
        } else {
          // Sometimes it might be already initialized or different structure depending on the build
          // But standard ammo.wasm.js returns a promise-like factory
          if ((window as any).Ammo) {
            console.log('✅ [Ammo] 已初始化');
            resolve();
          } else {
            console.log('⏳ [Ammo] 等待初始化...');
            setTimeout(checkAmmo, 100);
          }
        }
      };
      checkAmmo();
    };

    script.onerror = (e) => {
      console.error('❌ [Ammo] 加载失败:', e);
      reject(new Error(`Failed to load Ammo.js from ${config.scriptPath}. Please ensure the file exists.`));
      ammoPromise = null;
      (window as any).__AMMO_CONFIG_KEY__ = undefined;
    };

    document.body.appendChild(script);
  });

  return ammoPromise;
};


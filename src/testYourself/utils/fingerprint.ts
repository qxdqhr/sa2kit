/**
 * 设备指纹生成工具
 * Device Fingerprint Generator
 */

import type { DeviceFingerprint } from '../types';

/**
 * 生成Canvas指纹
 */
function getCanvasFingerprint(): string {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return 'no-canvas';

    canvas.width = 200;
    canvas.height = 50;

    // 绘制文字
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillStyle = '#f60';
    ctx.fillRect(0, 0, 200, 50);
    ctx.fillStyle = '#069';
    ctx.fillText('Canvas Fingerprint 🎨', 2, 15);

    // 转换为数据URL
    return canvas.toDataURL();
  } catch (error) {
    return 'canvas-error';
  }
}

/**
 * 生成WebGL指纹
 */
function getWebGLFingerprint(): string {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return 'no-webgl';

    const glContext = gl as WebGLRenderingContext;
    const debugInfo = glContext.getExtension('WEBGL_debug_renderer_info');
    
    if (debugInfo) {
      const vendor = glContext.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
      const renderer = glContext.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      return `${vendor}~${renderer}`;
    }

    return 'webgl-no-debug';
  } catch (error) {
    return 'webgl-error';
  }
}

/**
 * 检测可用字体
 */
function getAvailableFonts(): string {
  const testFonts = [
    'Arial', 'Verdana', 'Courier New', 'Georgia', 'Times New Roman',
    'Comic Sans MS', 'Trebuchet MS', 'Arial Black', 'Impact',
    'Courier', 'Helvetica', 'Monaco', 'Consolas', 'Menlo'
  ];
  
  const availableFonts: string[] = [];
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) return 'no-fonts';

  const baseFonts = ['monospace', 'sans-serif', 'serif'];
  const testString = 'mmmmmmmmmmlli';
  const baseWidths: { [key: string]: number } = {};

  // 获取基础字体宽度
  baseFonts.forEach(font => {
    ctx.font = `72px ${font}`;
    baseWidths[font] = ctx.measureText(testString).width;
  });

  // 测试每个字体
  testFonts.forEach(font => {
    let detected = false;
    baseFonts.forEach(baseFont => {
      ctx.font = `72px ${font}, ${baseFont}`;
      const width = ctx.measureText(testString).width;
      if (width !== baseWidths[baseFont]) {
        detected = true;
      }
    });
    if (detected) {
      availableFonts.push(font);
    }
  });

  return availableFonts.join(',') || 'no-custom-fonts';
}

/**
 * 获取设备指纹信息（增强版）
 */
export function getDeviceFingerprint(): DeviceFingerprint {
  const fingerprint: DeviceFingerprint = {
    // 基础信息
    userAgent: navigator.userAgent,
    screenResolution: `${window.screen.width}x${window.screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language,
    platform: navigator.platform,

    // 显示信息
    colorDepth: window.screen.colorDepth,
    devicePixelRatio: window.devicePixelRatio,

    // 硬件信息
    hardwareConcurrency: navigator.hardwareConcurrency || 0,
    maxTouchPoints: navigator.maxTouchPoints || 0,

    // Canvas和WebGL指纹
    canvasFingerprint: getCanvasFingerprint(),
    webglFingerprint: getWebGLFingerprint(),

    // 字体检测
    fonts: getAvailableFonts(),

    // 浏览器能力
    cookieEnabled: navigator.cookieEnabled,
    localStorageEnabled: (() => {
      try {
        return typeof localStorage !== 'undefined';
      } catch {
        return false;
      }
    })(),
    sessionStorageEnabled: (() => {
      try {
        return typeof sessionStorage !== 'undefined';
      } catch {
        return false;
      }
    })(),
    indexedDBEnabled: (() => {
      try {
        return typeof indexedDB !== 'undefined';
      } catch {
        return false;
      }
    })(),
  };

  return fingerprint;
}

/**
 * 尝试获取IP地址
 * 注意：由于浏览器安全限制，直接获取IP地址需要外部API
 */
export async function tryGetIPAddress(): Promise<string | null> {
  try {
    // 尝试使用公共API获取IP
    // 注意：这需要CORS支持，实际使用时可能需要配置
    const response = await fetch('https://api.ipify.org?format=json', {
      method: 'GET',
      mode: 'cors',
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.ip || null;
    }
  } catch (error) {
    console.warn('无法获取IP地址:', error);
  }
  
  return null;
}

/**
 * 简单的哈希函数 (DJB2算法)
 */
function simpleHash(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
  }
  return Math.abs(hash);
}

/**
 * 生成设备唯一标识
 * @param fingerprint 设备指纹
 * @param salt 盐值
 * @returns 唯一标识哈希值
 */
export function generateDeviceHash(
  fingerprint: DeviceFingerprint,
  salt: string = 'test-yourself-salt-2024'
): string {
  // 组合所有指纹信息（包含新增的特征）
  const components = [
    // 基础信息
    fingerprint.userAgent,
    fingerprint.ip || 'no-ip',
    fingerprint.screenResolution,
    fingerprint.timezone,
    fingerprint.language,
    fingerprint.platform,
    
    // 显示信息
    fingerprint.colorDepth?.toString() || '0',
    fingerprint.devicePixelRatio?.toString() || '0',
    
    // 硬件信息
    fingerprint.hardwareConcurrency?.toString() || '0',
    fingerprint.maxTouchPoints?.toString() || '0',
    
    // Canvas和WebGL指纹（这些是最独特的）
    fingerprint.canvasFingerprint || 'no-canvas',
    fingerprint.webglFingerprint || 'no-webgl',
    
    // 字体（不同设备安装的字体不同）
    fingerprint.fonts || 'no-fonts',
    
    // 浏览器能力
    fingerprint.cookieEnabled ? '1' : '0',
    fingerprint.localStorageEnabled ? '1' : '0',
    fingerprint.sessionStorageEnabled ? '1' : '0',
    fingerprint.indexedDBEnabled ? '1' : '0',
    
    // 盐值
    salt,
  ];

  // 拼接并生成哈希
  const combined = components.join('|');
  const hash = simpleHash(combined);
  
  return hash.toString(36); // 转换为36进制字符串
}

/**
 * 根据哈希值选择结果索引
 * @param hash 设备哈希值
 * @param totalResults 总结果数
 * @returns 结果索引 (0 到 totalResults-1)
 */
export function selectResultIndex(hash: string, totalResults: number): number {
  const numHash = parseInt(hash, 36);
  return numHash % totalResults;
}









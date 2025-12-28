import React, { 
  useEffect, 
  useRef, 
  useState, 
  useCallback, 
  forwardRef, 
  useImperativeHandle 
} from 'react';
import { MMDPlayerBase } from '../components/MMDPlayerBase';
import { MMDPlayerBaseRef, MMDResources } from '../types';
import { MMDARPlayerProps, MMDARPlayerRef } from './types';
import { Camera, CameraOff, RefreshCw, AlertCircle, Settings, X as CloseIcon, Check } from 'lucide-react';

/**
 * MMDARPlayer - 基于实时摄像头的 MMD 增强现实播放器
 * 
 * 功能：
 * - 调用设备摄像头作为背景
 * - 叠加透明背景的 MMD 模型渲染
 * - 支持前后摄像头切换
 * - 针对 AR 场景优化模型光照与定位
 */
export const MMDARPlayer = forwardRef<MMDARPlayerRef, MMDARPlayerProps>((props, ref) => {
  const {
    resources,
    stage = {},
    mobileOptimization,
    cameraConfig = { facingMode: 'user' },
    mirrored,
    showSettings = true,
    autoPlay = true,
    loop = true,
    onCameraReady,
    onCameraError,
    onResourcesChange,
    onLoad,
    onError,
    className,
    style,
  } = props;

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<MMDPlayerBaseRef>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // States
  const [isCameraStarted, setIsCameraStarted] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>(cameraConfig.facingMode || 'user');
  const [isLoading, setIsLoading] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [currentResources, setCurrentResources] = useState<MMDResources>(resources);
  const [tempResources, setTempResources] = useState<MMDResources>(resources);

  // 当外部 resources 变化时，同步内部资源（如果设置面板没打开）
  useEffect(() => {
    if (!isSettingsOpen) {
      setCurrentResources(resources);
      setTempResources(resources);
    }
  }, [resources, isSettingsOpen]);

  // 镜像逻辑：如果是前置摄像头且未明确指定 mirrored，则默认开启镜像
  const shouldMirror = mirrored !== undefined ? mirrored : facingMode === 'user';

  /**
   * 开启摄像头
   */
  const startCamera = useCallback(async (mode: 'user' | 'environment' = facingMode) => {
    try {
      setCameraError(null);
      
      // 如果已有流，先停止
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: mode,
          width: cameraConfig.width || { ideal: 1280 },
          height: cameraConfig.height || { ideal: 720 },
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsCameraStarted(true);
      setFacingMode(mode);
      onCameraReady?.(stream);
    } catch (err: any) {
      console.error('[MMDARPlayer] Camera access error:', err);
      const errorMsg = err.name === 'NotAllowedError' ? '摄像头权限被拒绝' : `无法访问摄像头: ${err.message}`;
      setCameraError(errorMsg);
      onCameraError?.(err instanceof Error ? err : new Error(errorMsg));
    }
  }, [facingMode, cameraConfig, onCameraReady, onCameraError]);

  /**
   * 关闭摄像头
   */
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraStarted(false);
  }, []);

  /**
   * 切换摄像头
   */
  const switchCamera = useCallback(async () => {
    const newMode = facingMode === 'user' ? 'environment' : 'user';
    await startCamera(newMode);
  }, [facingMode, startCamera]);

  /**
   * 截图 (包含视频背景和模型)
   */
  const snapshot = useCallback(async (): Promise<string> => {
    if (!videoRef.current || !playerRef.current) return '';

    const canvas = document.createElement('canvas');
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // 1. 绘制视频背景
    if (shouldMirror) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    if (shouldMirror) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }

    // 2. 绘制 MMD 模型 (WebGL Canvas)
    const mmdBase64 = playerRef.current.snapshot();
    const mmdImg = new Image();
    mmdImg.src = mmdBase64;
    
    await new Promise((resolve) => {
      mmdImg.onload = () => {
        // MMD 模型通常需要拉伸到与视频一致的尺寸（或者保持比例居中）
        ctx.drawImage(mmdImg, 0, 0, canvas.width, canvas.height);
        resolve(null);
      };
    });

    return canvas.toDataURL('image/png');
  }, [shouldMirror]);

  // 暴露接口
  useImperativeHandle(ref, () => ({
    startCamera,
    stopCamera,
    switchCamera,
    snapshot
  }));

  // 组件挂载时自动开启摄像头 (如果 autoPlay 为 true)
  useEffect(() => {
    if (autoPlay) {
      startCamera();
    }
    return () => stopCamera();
  }, [autoPlay, startCamera, stopCamera]);

  return (
    <div 
      className={`relative w-full h-full bg-black overflow-hidden ${className}`} 
      style={style}
    >
      {/* 1. 摄像头视频背景层 */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`absolute inset-0 w-full h-full object-cover transition-transform duration-500 ${shouldMirror ? 'scale-x-[-1]' : ''}`}
        style={{ zIndex: 0 }}
      />

      {/* 2. MMD 模型层 - 必须设置背景透明 */}
      <div 
        className="absolute inset-0 w-full h-full" 
        style={{ zIndex: 1 }}
      >
        <MMDPlayerBase
          ref={playerRef}
          resources={currentResources}
          stage={{
            ...stage,
            backgroundColor: 'transparent', // 强制透明背景
            cameraPosition: stage.cameraPosition || { x: 0, y: 15, z: 40 }, // 针对 AR 场景稍调高相机
          }}
          mobileOptimization={mobileOptimization}
          autoPlay={autoPlay}
          loop={loop}
          onLoad={() => {
            setIsLoading(false);
            onLoad?.();
          }}
          onError={onError}
        />
      </div>

      {/* 3. UI 交互层 */}
      <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-6">
        <div className="flex justify-between items-start pointer-events-auto">
          {cameraError ? (
            <div className="bg-red-500/80 backdrop-blur-md text-white px-4 py-2 rounded-full flex items-center gap-2 text-sm">
              <AlertCircle className="w-4 h-4" />
              {cameraError}
              <button 
                onClick={() => startCamera()}
                className="ml-2 underline"
              >
                重试
              </button>
            </div>
          ) : (
            <div className="bg-black/40 backdrop-blur-md text-white px-4 py-2 rounded-full flex items-center gap-2 text-sm">
              <Camera className="w-4 h-4 text-green-400" />
              {isCameraStarted ? '实景 AR 模式已开启' : '等待摄像头...'}
            </div>
          )}
          
          <div className="flex flex-col gap-2">
            {showSettings && (
              <button
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                className={`p-3 backdrop-blur-md rounded-full text-white transition-all active:scale-95 pointer-events-auto ${isSettingsOpen ? 'bg-blue-500' : 'bg-white/10 hover:bg-white/20'}`}
                title="设置模型与动作"
              >
                <Settings className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={switchCamera}
              className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-all active:scale-95 pointer-events-auto"
              title="切换前后摄像头"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            <button
              onClick={isCameraStarted ? stopCamera : () => startCamera()}
              className={`p-3 backdrop-blur-md rounded-full text-white transition-all active:scale-95 pointer-events-auto ${isCameraStarted ? 'bg-red-500/20 hover:bg-red-500/40' : 'bg-green-500/20 hover:bg-green-500/40'}`}
              title={isCameraStarted ? '关闭摄像头' : '开启摄像头'}
            >
              {isCameraStarted ? <CameraOff className="w-5 h-5" /> : <Camera className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* 4. 设置面板 */}
        {isSettingsOpen && (
          <div className="absolute top-20 right-6 w-80 bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 pointer-events-auto shadow-2xl animate-in slide-in-from-right-4 duration-300">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-white font-bold flex items-center gap-2">
                <Settings className="w-4 h-4" />
                资源设置
              </h3>
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="p-1 hover:bg-white/10 rounded-full transition-colors text-white/60"
              >
                <CloseIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-white/50 mb-1.5 ml-1 uppercase tracking-wider">模型路径 (.pmx)</label>
                <input
                  type="text"
                  value={tempResources.modelPath}
                  onChange={(e) => setTempResources({ ...tempResources, modelPath: e.target.value })}
                  placeholder="请输入模型 URL..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/10 focus:outline-none focus:border-blue-500/50 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-white/50 mb-1.5 ml-1 uppercase tracking-wider">动作路径 (.vmd)</label>
                <input
                  type="text"
                  value={tempResources.motionPath || ''}
                  onChange={(e) => setTempResources({ ...tempResources, motionPath: e.target.value })}
                  placeholder="请输入动作 URL..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/10 focus:outline-none focus:border-blue-500/50 transition-colors"
                />
              </div>

              <div className="pt-2">
                <button
                  onClick={() => {
                    setCurrentResources(tempResources);
                    onResourcesChange?.(tempResources);
                    setIsSettingsOpen(false);
                    setIsLoading(true);
                  }}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-blue-500/20"
                >
                  <Check className="w-4 h-4" />
                  应用更改
                </button>
              </div>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
              <div className="text-white text-sm font-medium bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm">
                正在加载 Miku 资源...
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

MMDARPlayer.displayName = 'MMDARPlayer';

export default MMDARPlayer;


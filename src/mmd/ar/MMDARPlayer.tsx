import React, { 
  useEffect, 
  useRef, 
  useState, 
  useCallback, 
  forwardRef, 
  useImperativeHandle,
  useMemo
} from 'react';
import { MMDPlayerBase } from '../components/MMDPlayerBase';
import { MMDPlayerBaseRef, MMDResources } from '../types';
import { MMDARPlayerProps, MMDARPlayerRef, ARMode } from './types';
import { Camera, CameraOff, RefreshCw, AlertCircle, Settings, X as CloseIcon, Sparkles, RotateCcw, ChevronDown, Compass, Layers } from 'lucide-react';

/**
 * 下拉选择组件
 */
interface SelectProps<T extends { id: string; name: string }> {
  label: string;
  options: T[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
  allowEmpty?: boolean;
  emptyLabel?: string;
}

function Select<T extends { id: string; name: string }>({ 
  label, 
  options, 
  value, 
  onChange,
  placeholder = '请选择...',
  allowEmpty = false,
  emptyLabel = '无'
}: SelectProps<T>) {
  const selectedOption = options.find(opt => opt.id === value);
  const showPlaceholder = !selectedOption && !allowEmpty && value !== '';
  
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-white/50 ml-1 uppercase tracking-wider">
        {label}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-10 text-sm text-white focus:outline-none focus:border-cyan-500/50 transition-colors cursor-pointer hover:bg-white/10"
        >
          {showPlaceholder && (
            <option value="" disabled className="bg-gray-900 text-white/50">
              {placeholder}
            </option>
          )}
          {allowEmpty && (
            <option value="" className="bg-gray-900 text-white/60">
              {emptyLabel}
            </option>
          )}
          {options.map((option) => (
            <option 
              key={option.id} 
              value={option.id}
              className="bg-gray-900 text-white"
            >
              {option.name}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
      </div>
    </div>
  );
}

/**
 * AR 模式切换组件
 */
interface ARModeSwitchProps {
  mode: ARMode;
  onChange: (mode: ARMode) => void;
  gyroSupported: boolean;
}

function ARModeSwitch({ mode, onChange, gyroSupported }: ARModeSwitchProps) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-white/50 ml-1 uppercase tracking-wider">
        AR 模式
      </label>
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => onChange(ARMode.Overlay)}
          className={`p-3 rounded-xl border transition-all flex flex-col items-center gap-1.5 ${
            mode === ARMode.Overlay
              ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
              : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
          }`}
        >
          <Layers className="w-5 h-5" />
          <span className="text-xs font-medium">叠加模式</span>
        </button>
        <button
          onClick={() => gyroSupported && onChange(ARMode.WorldFixed)}
          disabled={!gyroSupported}
          className={`p-3 rounded-xl border transition-all flex flex-col items-center gap-1.5 ${
            mode === ARMode.WorldFixed
              ? 'bg-purple-500/20 border-purple-500/50 text-purple-400'
              : gyroSupported 
                ? 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                : 'bg-white/5 border-white/10 text-white/30 cursor-not-allowed'
          }`}
          title={gyroSupported ? '世界固定模式' : '设备不支持陀螺仪'}
        >
          <Compass className="w-5 h-5" />
          <span className="text-xs font-medium">世界固定</span>
          {!gyroSupported && <span className="text-[10px] text-red-400">不支持</span>}
        </button>
      </div>
      <p className="text-[10px] text-white/40 ml-1 mt-1">
        {mode === ARMode.Overlay 
          ? '模型固定在屏幕上' 
          : '模型固定在世界空间，移动设备查看'}
      </p>
    </div>
  );
}

/**
 * MMDARPlayer - 基于实时摄像头的 MMD 增强现实播放器
 * 
 * 功能：
 * - 调用设备摄像头作为背景
 * - 点击放置模型交互
 * - 支持两种 AR 模式：叠加模式 / 世界固定模式
 * - 世界固定模式使用设备陀螺仪实现真正的 AR 体验
 */
export const MMDARPlayer = forwardRef<MMDARPlayerRef, MMDARPlayerProps>((props, ref) => {
  const {
    stage = {},
    mobileOptimization,
    cameraConfig = { facingMode: 'user' },
    mirrored,
    showSettings = true,
    modelPresets,
    motionPresets,
    audioPresets = [],
    defaultModelId,
    defaultMotionId,
    defaultAudioId,
    initialModelVisible = false,
    placementText = 'TOUCH!',
    defaultARMode = ARMode.Overlay,
    autoPlay = true,
    loop = true,
    onCameraReady,
    onCameraError,
    onResourcesChange,
    onModelPlaced,
    onARModeChange,
    onLoad,
    onError,
    className,
    style,
  } = props;

  // 计算默认选中项
  const initialModelId = defaultModelId || modelPresets[0]?.id || '';
  const initialMotionId = defaultMotionId || motionPresets[0]?.id || '';
  const initialAudioId = defaultAudioId || audioPresets[0]?.id || '';

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<MMDPlayerBaseRef>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const gyroDataRef = useRef({ alpha: 0, beta: 0, gamma: 0 });
  const initialOrientationRef = useRef<{ alpha: number; beta: number; gamma: number } | null>(null);

  // States
  const [isCameraStarted, setIsCameraStarted] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>(cameraConfig.facingMode || 'user');
  const [isLoading, setIsLoading] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [gyroSupported, setGyroSupported] = useState(false);
  const [gyroPermissionDenied, setGyroPermissionDenied] = useState(false);
  
  // 选中的资源 ID
  const [selectedModelId, setSelectedModelId] = useState(initialModelId);
  const [selectedMotionId, setSelectedMotionId] = useState(initialMotionId);
  const [selectedAudioId, setSelectedAudioId] = useState(initialAudioId);
  
  // 🎯 核心状态
  const [isModelPlaced, setIsModelPlaced] = useState(initialModelVisible);
  const [placementAnimation, setPlacementAnimation] = useState(false);
  const [arMode, setARModeState] = useState<ARMode>(defaultARMode);
  
  // 世界固定模式下的模型旋转
  const [modelRotation, setModelRotation] = useState({ x: 0, y: 0, z: 0 });

  // 根据选中的 ID 构建当前资源
  const currentResources: MMDResources = useMemo(() => {
    const model = modelPresets.find(m => m.id === selectedModelId);
    const motion = motionPresets.find(m => m.id === selectedMotionId);
    const audio = audioPresets.find(a => a.id === selectedAudioId);
    
    return {
      modelPath: model?.modelPath || modelPresets[0]?.modelPath || '',
      motionPath: motion?.motionPath || motionPresets[0]?.motionPath || '',
      audioPath: audio?.audioPath,
    };
  }, [selectedModelId, selectedMotionId, selectedAudioId, modelPresets, motionPresets, audioPresets]);

  // 镜像逻辑
  const shouldMirror = mirrored !== undefined ? mirrored : facingMode === 'user';

  /**
   * 检测陀螺仪支持
   */
  useEffect(() => {
    const checkGyroSupport = async () => {
      if (typeof window === 'undefined') return;
      
      // 检查 DeviceOrientationEvent 是否存在
      if (!('DeviceOrientationEvent' in window)) {
        setGyroSupported(false);
        return;
      }

      // iOS 13+ 需要请求权限
      if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
        try {
          const permission = await (DeviceOrientationEvent as any).requestPermission();
          setGyroSupported(permission === 'granted');
          setGyroPermissionDenied(permission === 'denied');
        } catch {
          setGyroSupported(false);
        }
      } else {
        // 其他设备，假设支持
        setGyroSupported(true);
      }
    };

    checkGyroSupport();
  }, []);

  /**
   * 陀螺仪数据处理 - 世界固定模式
   */
  useEffect(() => {
    if (arMode !== ARMode.WorldFixed || !isModelPlaced || !gyroSupported) return;

    const handleOrientation = (event: DeviceOrientationEvent) => {
      const { alpha, beta, gamma } = event;
      if (alpha === null || beta === null || gamma === null) return;

      // 记录初始方向
      if (!initialOrientationRef.current) {
        initialOrientationRef.current = { alpha, beta, gamma };
      }

      // 计算相对于初始方向的偏移
      const initial = initialOrientationRef.current;
      const deltaAlpha = alpha - initial.alpha;
      const deltaBeta = beta - initial.beta;
      const deltaGamma = gamma - initial.gamma;

      gyroDataRef.current = { alpha: deltaAlpha, beta: deltaBeta, gamma: deltaGamma };

      // 将设备方向转换为模型旋转（反向，使模型看起来固定在世界空间）
      setModelRotation({
        x: -deltaBeta * (Math.PI / 180) * 0.5, // 俯仰
        y: -deltaAlpha * (Math.PI / 180) * 0.5, // 偏航
        z: deltaGamma * (Math.PI / 180) * 0.3,  // 翻滚
      });
    };

    window.addEventListener('deviceorientation', handleOrientation, true);
    
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation, true);
    };
  }, [arMode, isModelPlaced, gyroSupported]);

  /**
   * 请求陀螺仪权限 (iOS)
   */
  const requestGyroPermission = useCallback(async () => {
    if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      try {
        const permission = await (DeviceOrientationEvent as any).requestPermission();
        setGyroSupported(permission === 'granted');
        setGyroPermissionDenied(permission === 'denied');
        return permission === 'granted';
      } catch {
        return false;
      }
    }
    return true;
  }, []);

  /**
   * 切换 AR 模式
   */
  const setARMode = useCallback(async (mode: ARMode) => {
    if (mode === ARMode.WorldFixed) {
      // 世界固定模式需要陀螺仪权限
      const hasPermission = await requestGyroPermission();
      if (!hasPermission) {
        console.warn('[MMDARPlayer] Gyro permission denied, staying in Overlay mode');
        return;
      }
      // 重置初始方向
      initialOrientationRef.current = null;
    }
    
    setARModeState(mode);
    onARModeChange?.(mode);
  }, [requestGyroPermission, onARModeChange]);

  /**
   * 放置模型
   */
  const placeModel = useCallback(() => {
    if (isModelPlaced) return;
    
    setPlacementAnimation(true);
    setIsLoading(true);
    
    // 重置初始方向（世界固定模式）
    initialOrientationRef.current = null;
    
    setTimeout(() => {
      setIsModelPlaced(true);
      setPlacementAnimation(false);
      onModelPlaced?.();
    }, 300);
  }, [isModelPlaced, onModelPlaced]);

  /**
   * 移除模型
   */
  const removeModel = useCallback(() => {
    setIsModelPlaced(false);
    setIsLoading(false);
    initialOrientationRef.current = null;
  }, []);

  /**
   * 切换模型
   */
  const switchModel = useCallback((newResources: MMDResources) => {
    const matchedModel = modelPresets.find(m => m.modelPath === newResources.modelPath);
    const matchedMotion = motionPresets.find(m => m.motionPath === newResources.motionPath);
    const matchedAudio = audioPresets.find(a => a.audioPath === newResources.audioPath);
    
    if (matchedModel) setSelectedModelId(matchedModel.id);
    if (matchedMotion) setSelectedMotionId(matchedMotion.id);
    if (matchedAudio) setSelectedAudioId(matchedAudio.id);
    
    onResourcesChange?.(newResources);
    if (isModelPlaced) {
      setIsLoading(true);
    }
  }, [isModelPlaced, onResourcesChange, modelPresets, motionPresets, audioPresets]);

  /**
   * 应用设置
   */
  const applySettings = useCallback(() => {
    onResourcesChange?.(currentResources);
    setIsSettingsOpen(false);
    if (isModelPlaced) {
      setIsLoading(true);
    }
  }, [currentResources, isModelPlaced, onResourcesChange]);

  /**
   * 重置位置
   */
  const resetPosition = useCallback(() => {
    setIsModelPlaced(false);
    setIsLoading(false);
    setIsSettingsOpen(false);
    initialOrientationRef.current = null;
    setModelRotation({ x: 0, y: 0, z: 0 });
  }, []);

  /**
   * 开启摄像头
   */
  const startCamera = useCallback(async (mode: 'user' | 'environment' = facingMode) => {
    try {
      setCameraError(null);
      
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
   * 截图
   */
  const snapshot = useCallback(async (): Promise<string> => {
    if (!videoRef.current || !playerRef.current) return '';

    const canvas = document.createElement('canvas');
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    if (shouldMirror) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    if (shouldMirror) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }

    if (isModelPlaced) {
      const mmdBase64 = playerRef.current.snapshot();
      const mmdImg = new Image();
      mmdImg.src = mmdBase64;
      
      await new Promise((resolve) => {
        mmdImg.onload = () => {
          ctx.drawImage(mmdImg, 0, 0, canvas.width, canvas.height);
          resolve(null);
        };
      });
    }

    return canvas.toDataURL('image/png');
  }, [shouldMirror, isModelPlaced]);

  // 暴露接口
  useImperativeHandle(ref, () => ({
    startCamera,
    stopCamera,
    switchCamera,
    snapshot,
    placeModel,
    removeModel,
    switchModel,
    setARMode,
    getARMode: () => arMode,
  }));

  // 自动开启摄像头
  useEffect(() => {
    if (autoPlay) {
      startCamera();
    }
    return () => stopCamera();
  }, [autoPlay, startCamera, stopCamera]);

  // 资源变化通知
  useEffect(() => {
    onResourcesChange?.(currentResources);
  }, [currentResources, onResourcesChange]);

  // 计算世界固定模式下的模型容器样式
  const modelContainerStyle = useMemo(() => {
    if (arMode !== ARMode.WorldFixed) return {};
    
    return {
      transform: `rotateX(${modelRotation.x}rad) rotateY(${modelRotation.y}rad) rotateZ(${modelRotation.z}rad)`,
      transformStyle: 'preserve-3d' as const,
      transition: 'transform 0.1s ease-out',
    };
  }, [arMode, modelRotation]);

  return (
    <div 
      ref={containerRef}
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

      {/* 2. MMD 模型层 */}
      {isModelPlaced && (
        <div 
          className={`absolute inset-0 w-full h-full transition-all duration-500 ${placementAnimation ? 'scale-110 opacity-0' : 'scale-100 opacity-100'}`}
          style={{ 
            zIndex: 1,
            ...modelContainerStyle,
          }}
        >
          <MMDPlayerBase
            key={`${selectedModelId}-${selectedMotionId}-${selectedAudioId}-${arMode}`}
            ref={playerRef}
            resources={currentResources}
            stage={{
              ...stage,
              backgroundColor: 'transparent',
              cameraPosition: stage.cameraPosition || { x: 0, y: 15, z: 40 },
            }}
            mobileOptimization={mobileOptimization}
            autoPlay={true}
            loop={loop}
            onLoad={() => {
              setIsLoading(false);
              onLoad?.();
            }}
            onError={onError}
          />
        </div>
      )}

      {/* 3. 放置指示器 */}
      {!isModelPlaced && isCameraStarted && (
        <div 
          className="absolute inset-0 z-5 flex items-center justify-center"
          onClick={placeModel}
        >
          <button
            onClick={placeModel}
            className={`
              relative group cursor-pointer
              transition-all duration-300 ease-out
              hover:scale-110 active:scale-95
              ${placementAnimation ? 'scale-150 opacity-0' : 'scale-100 opacity-100'}
            `}
          >
            <div className="absolute inset-0 -m-4 rounded-2xl bg-cyan-400/20 animate-ping" />
            <div className="absolute inset-0 -m-2 rounded-xl bg-cyan-400/30 animate-pulse" />
            
            <div className="relative bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 p-1 rounded-2xl shadow-2xl shadow-cyan-500/50">
              <div className="bg-black/80 backdrop-blur-xl px-8 py-6 rounded-xl flex flex-col items-center gap-3">
                <div className="relative">
                  <Sparkles className="w-10 h-10 text-cyan-400 animate-pulse" />
                  <div className="absolute inset-0 w-10 h-10 bg-cyan-400/30 blur-xl" />
                </div>
                
                <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 tracking-widest">
                  {placementText}
                </span>
                
                <span className="text-xs text-white/50 font-medium">
                  {arMode === ARMode.WorldFixed ? '点击放置到世界空间 🌍' : '点击召唤 Miku ✨'}
                </span>
              </div>
            </div>

            <div className="absolute -top-2 -right-2 w-4 h-4 bg-yellow-400 rounded-full animate-bounce shadow-lg shadow-yellow-400/50" />
            <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-pink-400 rounded-full animate-bounce delay-100 shadow-lg shadow-pink-400/50" />
          </button>
        </div>
      )}

      {/* 4. UI 交互层 */}
      <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-6">
        <div className="flex justify-between items-start pointer-events-auto">
          {cameraError ? (
            <div className="bg-red-500/80 backdrop-blur-md text-white px-4 py-2 rounded-full flex items-center gap-2 text-sm">
              <AlertCircle className="w-4 h-4" />
              {cameraError}
              <button onClick={() => startCamera()} className="ml-2 underline">重试</button>
            </div>
          ) : (
            <div className={`backdrop-blur-md text-white px-4 py-2 rounded-full flex items-center gap-2 text-sm ${
              arMode === ARMode.WorldFixed ? 'bg-purple-500/40' : 'bg-black/40'
            }`}>
              {arMode === ARMode.WorldFixed ? (
                <Compass className="w-4 h-4 text-purple-400" />
              ) : (
                <Camera className="w-4 h-4 text-green-400" />
              )}
              {isCameraStarted 
                ? (isModelPlaced 
                    ? (arMode === ARMode.WorldFixed ? '世界固定 AR' : '叠加 AR 模式')
                    : '点击放置模型')
                : '等待摄像头...'
              }
            </div>
          )}
          
          <div className="flex flex-col gap-2">
            {showSettings && (
              <button
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                className={`p-3 backdrop-blur-md rounded-full text-white transition-all active:scale-95 ${isSettingsOpen ? 'bg-cyan-500' : 'bg-white/10 hover:bg-white/20'}`}
              >
                <Settings className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={switchCamera}
              className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-all active:scale-95"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            <button
              onClick={isCameraStarted ? stopCamera : () => startCamera()}
              className={`p-3 backdrop-blur-md rounded-full text-white transition-all active:scale-95 ${isCameraStarted ? 'bg-red-500/20 hover:bg-red-500/40' : 'bg-green-500/20 hover:bg-green-500/40'}`}
            >
              {isCameraStarted ? <CameraOff className="w-5 h-5" /> : <Camera className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* 5. 设置面板 */}
        {isSettingsOpen && (
          <div className="absolute top-20 right-6 w-72 max-h-[75vh] overflow-y-auto bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl p-5 pointer-events-auto shadow-2xl animate-in slide-in-from-right-4 duration-300">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-bold flex items-center gap-2">
                <Settings className="w-4 h-4 text-cyan-400" />
                AR 设置
              </h3>
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-white/60"
              >
                <CloseIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* AR 模式切换 */}
              <ARModeSwitch 
                mode={arMode} 
                onChange={setARMode} 
                gyroSupported={gyroSupported}
              />

              {gyroPermissionDenied && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-xs text-red-400">
                  陀螺仪权限被拒绝，无法使用世界固定模式
                </div>
              )}

              <div className="border-t border-white/10 pt-4" />

              {/* 模型选择 */}
              <Select
                label="选择模型"
                options={modelPresets}
                value={selectedModelId}
                onChange={setSelectedModelId}
              />

              {/* 动作选择 */}
              <Select
                label="选择动作"
                options={motionPresets}
                value={selectedMotionId}
                onChange={setSelectedMotionId}
              />

              {/* 音乐选择 */}
              {audioPresets.length > 0 && (
                <Select
                  label="选择音乐"
                  options={audioPresets}
                  value={selectedAudioId}
                  onChange={setSelectedAudioId}
                  allowEmpty={true}
                  emptyLabel="🔇 不播放音乐"
                />
              )}

              {/* 操作按钮 */}
              <div className="pt-3 space-y-2">
                {isModelPlaced && (
                  <button
                    onClick={applySettings}
                    className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-cyan-500/20"
                  >
                    <Sparkles className="w-4 h-4" />
                    应用更改
                  </button>
                )}

                <button
                  onClick={resetPosition}
                  className={`w-full ${isModelPlaced ? 'bg-white/5 hover:bg-white/10 text-white/70' : 'bg-cyan-500 hover:bg-cyan-600 text-white shadow-lg shadow-cyan-500/20'} font-medium py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 border border-white/10`}
                >
                  <RotateCcw className="w-4 h-4" />
                  {isModelPlaced ? '重置位置' : '开始放置'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 6. 加载指示器 */}
        {isLoading && isModelPlaced && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
              <div className="text-white text-sm font-medium bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm">
                {arMode === ARMode.WorldFixed ? '正在定位到世界空间...' : '正在召唤 Miku...'}
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

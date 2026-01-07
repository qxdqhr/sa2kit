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
import { MMDARPlayerProps, MMDARPlayerRef } from './types';
import { Camera, CameraOff, RefreshCw, AlertCircle, Settings, X as CloseIcon, Sparkles, RotateCcw, ChevronDown } from 'lucide-react';

/**
 * 下拉选择组件
 */
interface SelectProps<T extends { id: string; name: string }> {
  label: string;
  options: T[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
  /** 是否允许空选项 */
  allowEmpty?: boolean;
  /** 空选项的显示文本 */
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
 * MMDARPlayer - 基于实时摄像头的 MMD 增强现实播放器
 * 
 * 功能：
 * - 调用设备摄像头作为背景
 * - 点击放置模型交互
 * - 叠加透明背景的 MMD 模型渲染
 * - 支持前后摄像头切换
 * - 设置面板支持模型/动作/音乐下拉选择
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
    autoPlay = true,
    loop = true,
    onCameraReady,
    onCameraError,
    onResourcesChange,
    onModelPlaced,
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

  // States
  const [isCameraStarted, setIsCameraStarted] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>(cameraConfig.facingMode || 'user');
  const [isLoading, setIsLoading] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // 选中的资源 ID
  const [selectedModelId, setSelectedModelId] = useState(initialModelId);
  const [selectedMotionId, setSelectedMotionId] = useState(initialMotionId);
  const [selectedAudioId, setSelectedAudioId] = useState(initialAudioId);
  
  // 🎯 核心状态：模型是否已放置
  const [isModelPlaced, setIsModelPlaced] = useState(initialModelVisible);
  const [placementAnimation, setPlacementAnimation] = useState(false);

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

  // 镜像逻辑：如果是前置摄像头且未明确指定 mirrored，则默认开启镜像
  const shouldMirror = mirrored !== undefined ? mirrored : facingMode === 'user';

  /**
   * 放置模型
   */
  const placeModel = useCallback(() => {
    if (isModelPlaced) return;
    
    setPlacementAnimation(true);
    setIsLoading(true);
    
    // 触发放置动画
    setTimeout(() => {
      setIsModelPlaced(true);
      setPlacementAnimation(false);
      onModelPlaced?.();
    }, 300);
  }, [isModelPlaced, onModelPlaced]);

  /**
   * 移除模型（重置位置）
   */
  const removeModel = useCallback(() => {
    setIsModelPlaced(false);
    setIsLoading(false);
  }, []);

  /**
   * 切换模型
   */
  const switchModel = useCallback((newResources: MMDResources) => {
    // 找到匹配的预设并更新选中状态
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
   * 应用设置面板的更改
   */
  const applySettings = useCallback(() => {
    onResourcesChange?.(currentResources);
    setIsSettingsOpen(false);
    if (isModelPlaced) {
      setIsLoading(true);
    }
  }, [currentResources, isModelPlaced, onResourcesChange]);

  /**
   * 重置模型位置（回到 TOUCH 按钮状态）
   */
  const resetPosition = useCallback(() => {
    setIsModelPlaced(false);
    setIsLoading(false);
    setIsSettingsOpen(false);
  }, []);

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
  }));

  // 组件挂载时自动开启摄像头
  useEffect(() => {
    if (autoPlay) {
      startCamera();
    }
    return () => stopCamera();
  }, [autoPlay, startCamera, stopCamera]);

  // 当资源变化时通知父组件
  useEffect(() => {
    onResourcesChange?.(currentResources);
  }, [currentResources, onResourcesChange]);

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

      {/* 2. MMD 模型层 - 仅在放置后显示 */}
      {isModelPlaced && (
        <div 
          className={`absolute inset-0 w-full h-full transition-all duration-500 ${placementAnimation ? 'scale-110 opacity-0' : 'scale-100 opacity-100'}`}
          style={{ zIndex: 1 }}
        >
          <MMDPlayerBase
            key={`${selectedModelId}-${selectedMotionId}-${selectedAudioId}`}
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

      {/* 3. 放置指示器 - 模型未放置时显示 */}
      {!isModelPlaced && isCameraStarted && (
        <div 
          className="absolute inset-0 z-5 flex items-center justify-center"
          onClick={placeModel}
        >
          {/* 点击放置按钮 */}
          <button
            onClick={placeModel}
            className={`
              relative group cursor-pointer
              transition-all duration-300 ease-out
              hover:scale-110 active:scale-95
              ${placementAnimation ? 'scale-150 opacity-0' : 'scale-100 opacity-100'}
            `}
          >
            {/* 外圈脉冲动画 */}
            <div className="absolute inset-0 -m-4 rounded-2xl bg-cyan-400/20 animate-ping" />
            <div className="absolute inset-0 -m-2 rounded-xl bg-cyan-400/30 animate-pulse" />
            
            {/* 主按钮 */}
            <div className="relative bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 p-1 rounded-2xl shadow-2xl shadow-cyan-500/50">
              <div className="bg-black/80 backdrop-blur-xl px-8 py-6 rounded-xl flex flex-col items-center gap-3">
                {/* 图标 */}
                <div className="relative">
                  <Sparkles className="w-10 h-10 text-cyan-400 animate-pulse" />
                  <div className="absolute inset-0 w-10 h-10 bg-cyan-400/30 blur-xl" />
                </div>
                
                {/* 文字 */}
                <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 tracking-widest">
                  {placementText}
                </span>
                
                {/* 提示 */}
                <span className="text-xs text-white/50 font-medium">
                  点击召唤 Miku ✨
                </span>
              </div>
            </div>

            {/* 装饰星星 */}
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
              {isCameraStarted 
                ? (isModelPlaced ? '实景 AR 模式' : '点击放置模型')
                : '等待摄像头...'
              }
            </div>
          )}
          
          <div className="flex flex-col gap-2">
            {showSettings && (
              <button
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                className={`p-3 backdrop-blur-md rounded-full text-white transition-all active:scale-95 pointer-events-auto ${isSettingsOpen ? 'bg-cyan-500' : 'bg-white/10 hover:bg-white/20'}`}
                title="设置"
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

        {/* 5. 设置面板 */}
        {isSettingsOpen && (
          <div className="absolute top-20 right-6 w-72 bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl p-5 pointer-events-auto shadow-2xl animate-in slide-in-from-right-4 duration-300">
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
              {/* 模型选择 */}
              <Select
                label="选择模型"
                options={modelPresets}
                value={selectedModelId}
                onChange={setSelectedModelId}
                placeholder="请选择模型..."
              />

              {/* 动作选择 */}
              <Select
                label="选择动作"
                options={motionPresets}
                value={selectedMotionId}
                onChange={setSelectedMotionId}
                placeholder="请选择动作..."
              />

              {/* 音乐选择 (可选，支持不播放) */}
              {audioPresets.length > 0 && (
                <Select
                  label="选择音乐"
                  options={audioPresets}
                  value={selectedAudioId}
                  onChange={setSelectedAudioId}
                  placeholder="请选择音乐..."
                  allowEmpty={true}
                  emptyLabel="🔇 不播放音乐"
                />
              )}

              {/* 操作按钮 */}
              <div className="pt-3 space-y-2">
                {/* 应用更改按钮 - 仅在模型已放置时显示 */}
                {isModelPlaced && (
                  <button
                    onClick={applySettings}
                    className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-cyan-500/20"
                  >
                    <Sparkles className="w-4 h-4" />
                    应用更改
                  </button>
                )}

                {/* 重置位置按钮 */}
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
                正在召唤 Miku...
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

import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState
} from 'react';
import * as THREE from 'three';
import { clsx } from 'clsx';
import { MMDAnimationHelper, MMDLoader } from 'three-stdlib';
import { DEFAULT_AR_ASSETS, loadARJS } from '../../ar';
import type { MMDResources } from '../types';
import { configureMaterialsForMMD } from '../utils/mmd-loader-config';
import { ARMode, MMDARPlayerProps, MMDARPlayerRef } from './types';

const DEFAULT_MODEL_SCALE = 0.1;

function disposeMesh(object: THREE.Object3D) {
  object.traverse((child) => {
    if (child instanceof THREE.Mesh || child instanceof THREE.SkinnedMesh) {
      if (child.geometry) {
        child.geometry.dispose();
      }
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      materials.forEach((material) => {
        if (material instanceof THREE.Material) {
          Object.values(material).forEach((value) => {
            if (value instanceof THREE.Texture) {
              value.dispose();
            }
          });
          material.dispose();
        }
      });
    }
  });
}

export const MMDARApp = forwardRef<MMDARPlayerRef, MMDARPlayerProps>((props, ref) => {
  const {
    stage,
    mobileOptimization,
    cameraConfig,
    cameraParametersUrl,
    markerConfig,
    mirrored = false,
    showSettings,
    modelPresets,
    motionPresets,
    audioPresets,
    defaultModelId,
    defaultMotionId,
    defaultAudioId,
    modelScale,
    modelOffset,
    initialModelVisible = false,
    placementText = 'Place Model',
    arMode,
    defaultARMode,
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
    style
  } = props;

  const containerRef = useRef<HTMLDivElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.Camera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const arToolkitSourceRef = useRef<any>(null);
  const arToolkitContextRef = useRef<any>(null);
  const markerRootRef = useRef<THREE.Group | null>(null);
  const markerControlsRef = useRef<any>(null);
  const modelRootRef = useRef<THREE.Group | null>(null);
  const mmdHelperRef = useRef<MMDAnimationHelper | null>(null);
  const mmdMeshRef = useRef<THREE.SkinnedMesh | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const markerDetectedRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const autoPlayRef = useRef(autoPlay);

  const [isLoading, setIsLoading] = useState(true);
  const [cameraReady, setCameraReady] = useState(false);
  const [arReady, setArReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [markerDetected, setMarkerDetected] = useState(false);
  const [modelPlaced, setModelPlaced] = useState(initialModelVisible);
  const [settingsVisible, setSettingsVisible] = useState(showSettings ?? false);
  const [internalARMode, setInternalARMode] = useState(
    defaultARMode ?? arMode ?? ARMode.Overlay
  );
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>(
    cameraConfig?.facingMode ?? 'environment'
  );

  const [selectedModelId, setSelectedModelId] = useState(
    defaultModelId ?? modelPresets[0]?.id ?? ''
  );
  const [selectedMotionId, setSelectedMotionId] = useState(
    defaultMotionId ?? motionPresets[0]?.id ?? ''
  );
  const [selectedAudioId, setSelectedAudioId] = useState(
    defaultAudioId ?? audioPresets?.[0]?.id ?? ''
  );
  const [overrideResources, setOverrideResources] = useState<MMDResources | null>(null);

  const resolvedARMode = arMode ?? internalARMode;

  const resolvedMarkerConfig = useMemo(() => {
    return {
      type: markerConfig?.type ?? 'pattern',
      patternUrl: markerConfig?.patternUrl ?? DEFAULT_AR_ASSETS.patternUrl,
      barcodeValue: markerConfig?.barcodeValue ?? 0,
      changeMatrixMode: markerConfig?.changeMatrixMode ?? 'modelViewMatrix'
    };
  }, [markerConfig]);

  const resolvedResources = useMemo<MMDResources | null>(() => {
    if (overrideResources) {
      return overrideResources;
    }

    const modelPreset = modelPresets.find((preset) => preset.id === selectedModelId);
    if (!modelPreset) {
      return null;
    }

    const motionPreset = motionPresets.find((preset) => preset.id === selectedMotionId);
    const audioPreset = audioPresets?.find((preset) => preset.id === selectedAudioId);

    return {
      modelPath: modelPreset.modelPath,
      motionPath: motionPreset?.motionPath,
      audioPath: audioPreset?.audioPath
    };
  }, [
    overrideResources,
    modelPresets,
    motionPresets,
    audioPresets,
    selectedModelId,
    selectedMotionId,
    selectedAudioId
  ]);

  const resolveModelScale = useCallback(() => {
    if (!modelScale) {
      return new THREE.Vector3(DEFAULT_MODEL_SCALE, DEFAULT_MODEL_SCALE, DEFAULT_MODEL_SCALE);
    }
    if (typeof modelScale === 'number') {
      return new THREE.Vector3(modelScale, modelScale, modelScale);
    }
    return new THREE.Vector3(modelScale.x, modelScale.y, modelScale.z);
  }, [modelScale]);

  const applyModelTransform = useCallback(
    (mesh: THREE.Object3D) => {
      const scale = resolveModelScale();
      mesh.scale.copy(scale);

      if (modelOffset) {
        mesh.position.set(modelOffset.x, modelOffset.y, modelOffset.z);
        return;
      }

      const box = new THREE.Box3().setFromObject(mesh);
      if (Number.isFinite(box.min.y)) {
        mesh.position.y += -box.min.y;
      }
    },
    [modelOffset, resolveModelScale]
  );

  const updateModelPlacement = useCallback(
    (visible: boolean) => {
      if (!modelRootRef.current) return;
      modelRootRef.current.visible = visible;
      setModelPlaced(visible);
    },
    []
  );

  const attachModelRoot = useCallback(
    (mode: ARMode) => {
      if (!modelRootRef.current || !sceneRef.current || !cameraRef.current) return;

      if (mode === ARMode.Overlay) {
        if (modelRootRef.current.parent !== cameraRef.current) {
          modelRootRef.current.parent?.remove(modelRootRef.current);
          cameraRef.current.add(modelRootRef.current);
        }
        modelRootRef.current.position.set(0, -1, -3);
        modelRootRef.current.quaternion.identity();
        updateModelPlacement(true);
      } else {
        if (modelRootRef.current.parent !== sceneRef.current) {
          modelRootRef.current.parent?.remove(modelRootRef.current);
          sceneRef.current.add(modelRootRef.current);
        }
        updateModelPlacement(initialModelVisible);
      }
    },
    [initialModelVisible, updateModelPlacement]
  );

  const stopCameraStream = useCallback(() => {
    const source = arToolkitSourceRef.current;
    if (!source?.domElement) return;
    const stream = source.domElement.srcObject as MediaStream | null;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
  }, []);

  const cleanupAR = useCallback(() => {
    stopCameraStream();

    if (markerRootRef.current && sceneRef.current) {
      sceneRef.current.remove(markerRootRef.current);
      markerRootRef.current.clear();
    }
    markerRootRef.current = null;
    markerControlsRef.current = null;

    const videoContainer = videoContainerRef.current;
    const videoElement = arToolkitSourceRef.current?.domElement;
    if (videoContainer && videoElement && videoElement.parentElement === videoContainer) {
      videoContainer.removeChild(videoElement);
    }

    arToolkitSourceRef.current?.dispose?.();
    arToolkitSourceRef.current = null;
    arToolkitContextRef.current = null;
    markerDetectedRef.current = false;
    setMarkerDetected(false);
    setCameraReady(false);
    setArReady(false);
  }, [stopCameraStream]);

  const setupRenderer = useCallback(() => {
    if (rendererRef.current) return;
    if (!canvasRef.current) return;

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: true
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(mobileOptimization?.pixelRatio ?? window.devicePixelRatio ?? 1);
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.Camera();
    cameraRef.current = camera;
    scene.add(camera);

    const modelRoot = new THREE.Group();
    modelRoot.visible = initialModelVisible;
    modelRootRef.current = modelRoot;
    scene.add(modelRoot);

    const ambientLight = new THREE.AmbientLight(
      0xffffff,
      stage?.ambientLightIntensity ?? 0.8
    );
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(
      0xffffff,
      stage?.directionalLightIntensity ?? 0.6
    );
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    attachModelRoot(resolvedARMode);
  }, [
    attachModelRoot,
    initialModelVisible,
    mobileOptimization?.pixelRatio,
    resolvedARMode,
    stage?.ambientLightIntensity,
    stage?.directionalLightIntensity
  ]);

  const resize = useCallback(() => {
    if (!containerRef.current || !rendererRef.current) return;
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    if (width === 0 || height === 0) return;

    rendererRef.current.setSize(width, height);

    const source = arToolkitSourceRef.current;
    if (source?.onResizeElement && source?.copyElementSizeTo) {
      source.onResizeElement();
      source.copyElementSizeTo(rendererRef.current.domElement);
      if (arToolkitContextRef.current?.arController?.canvas) {
        source.copyElementSizeTo(arToolkitContextRef.current.arController.canvas);
      }
    }
  }, []);

  const startRenderLoop = useCallback(() => {
    if (animationFrameRef.current) return;
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;
    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    const camera = cameraRef.current;

    const clock = new THREE.Clock();

    const render = () => {
      animationFrameRef.current = requestAnimationFrame(render);

      if (arToolkitSourceRef.current?.ready) {
        arToolkitContextRef.current?.update(arToolkitSourceRef.current.domElement);
        if (markerRootRef.current) {
          const isVisible = markerRootRef.current.visible;
          if (isVisible !== markerDetectedRef.current) {
            markerDetectedRef.current = isVisible;
            setMarkerDetected(isVisible);
          }
        }
      }

      if (mmdHelperRef.current && autoPlayRef.current) {
        const delta = clock.getDelta();
        mmdHelperRef.current.update(delta);
      }

      renderer.render(scene, camera);
    };

    render();
  }, []);

  const setupAR = useCallback(async (facingOverride?: 'user' | 'environment') => {
    if (!sceneRef.current || !cameraRef.current) return;

    const THREEx = await loadARJS({ three: THREE });

    const facingMode = facingOverride ?? cameraFacing;
    const sourceWidth =
      typeof cameraConfig?.width === 'number' ? cameraConfig.width : cameraConfig?.width?.ideal;
    const sourceHeight =
      typeof cameraConfig?.height === 'number' ? cameraConfig.height : cameraConfig?.height?.ideal;

    const arToolkitSource = new THREEx.ArToolkitSource({
      sourceType: 'webcam',
      sourceWidth: sourceWidth ?? 1280,
      sourceHeight: sourceHeight ?? 720,
      facingMode
    });
    arToolkitSourceRef.current = arToolkitSource;

    const arToolkitContext = new THREEx.ArToolkitContext({
      cameraParametersUrl: cameraParametersUrl ?? DEFAULT_AR_ASSETS.cameraParametersUrl,
      detectionMode: 'mono',
      maxDetectionRate: 30
    });
    arToolkitContextRef.current = arToolkitContext;

    const markerRoot = new THREE.Group();
    markerRootRef.current = markerRoot;
    sceneRef.current.add(markerRoot);

    markerControlsRef.current = new THREEx.ArMarkerControls(
      arToolkitContext,
      markerRoot,
      resolvedMarkerConfig
    );

    arToolkitContext.init(() => {
      if (!cameraRef.current) return;
      cameraRef.current.projectionMatrix.copy(arToolkitContext.getProjectionMatrix());
      setArReady(true);
    });

    arToolkitSource.init(() => {
      const videoElement = arToolkitSource.domElement;
      if (videoContainerRef.current && videoElement.parentElement !== videoContainerRef.current) {
        videoContainerRef.current.appendChild(videoElement);
      }
      videoElement.setAttribute('playsinline', 'true');
      videoElement.style.position = 'absolute';
      videoElement.style.inset = '0';
      videoElement.style.width = '100%';
      videoElement.style.height = '100%';
      videoElement.style.objectFit = 'cover';
      videoElement.style.zIndex = '0';
      if (mirrored) {
        videoElement.style.transform = 'scaleX(-1)';
      }
      setCameraReady(true);

      const stream = videoElement.srcObject as MediaStream | null;
      if (stream) {
        onCameraReady?.(stream);
      }

      resize();
    });
  }, [
    cameraConfig?.height,
    cameraConfig?.width,
    cameraFacing,
    cameraParametersUrl,
    mirrored,
    onCameraReady,
    resize,
    resolvedMarkerConfig
  ]);

  const loadMMDResources = useCallback(async () => {
    if (!resolvedResources || !sceneRef.current || !modelRootRef.current) {
      return;
    }

    setIsLoading(true);
    setError(null);

    if (mmdMeshRef.current) {
      if (mmdHelperRef.current) {
        mmdHelperRef.current.remove(mmdMeshRef.current);
      }
      modelRootRef.current.remove(mmdMeshRef.current);
      disposeMesh(mmdMeshRef.current);
      mmdMeshRef.current = null;
    }

    if (!mmdHelperRef.current) {
      mmdHelperRef.current = new MMDAnimationHelper({ afterglow: 2.0 });
    }

    const loader = new MMDLoader();

    const loadModel = () =>
      new Promise<{ mesh: THREE.SkinnedMesh; animation?: THREE.AnimationClip }>((resolve, reject) => {
        if (resolvedResources.motionPath) {
          loader.loadWithAnimation(
            resolvedResources.modelPath,
            resolvedResources.motionPath,
            (mmd) => resolve({ mesh: mmd.mesh, animation: mmd.animation }),
            undefined,
            (err) => reject(err)
          );
        } else {
          loader.load(
            resolvedResources.modelPath,
            (mesh) => resolve({ mesh: mesh as THREE.SkinnedMesh }),
            undefined,
            (err) => reject(err)
          );
        }
      });

    try {
      const { mesh, animation } = await loadModel();

      configureMaterialsForMMD(mesh, {
        enableGradientMap: true,
        shininess: 30,
        specularColor: 0x888888
      });

      applyModelTransform(mesh);
      mesh.castShadow = true;
      mesh.receiveShadow = stage?.modelReceiveShadow ?? true;

      mmdMeshRef.current = mesh;
      modelRootRef.current.add(mesh);

      if (animation) {
        mmdHelperRef.current.add(mesh, {
          animation,
          physics: false
        });
      }

      setIsLoading(false);
      onResourcesChange?.(resolvedResources);
      onLoad?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load MMD resources';
      setError(message);
      setIsLoading(false);
      onError?.(err instanceof Error ? err : new Error(message));
    }
  }, [applyModelTransform, onError, onLoad, onResourcesChange, resolvedResources, stage?.modelReceiveShadow]);

  const updateAudio = useCallback(() => {
    if (!resolvedResources?.audioPath) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }

    const audio = new Audio(resolvedResources.audioPath);
    audio.loop = loop;
    audioRef.current = audio;

    if (autoPlay || modelPlaced) {
      audio.play().catch(() => undefined);
    }
  }, [autoPlay, loop, modelPlaced, resolvedResources?.audioPath]);

  const placeModel = useCallback(() => {
    if (!modelRootRef.current) return;
    if (resolvedARMode === ARMode.Overlay) {
      updateModelPlacement(true);
      onModelPlaced?.();
      return;
    }
    if (!markerRootRef.current) return;

    modelRootRef.current.position.copy(markerRootRef.current.position);
    modelRootRef.current.quaternion.copy(markerRootRef.current.quaternion);
    updateModelPlacement(true);
    onModelPlaced?.();
  }, [onModelPlaced, resolvedARMode, updateModelPlacement]);

  const removeModel = useCallback(() => {
    updateModelPlacement(false);
  }, [updateModelPlacement]);

  useImperativeHandle(ref, () => ({
    startCamera: async () => {
      cleanupAR();
      await setupAR();
    },
    stopCamera: () => {
      cleanupAR();
    },
    switchCamera: async () => {
      const next = cameraFacing === 'environment' ? 'user' : 'environment';
      setCameraFacing(next);
      cleanupAR();
      await setupAR(next);
    },
    snapshot: async () => {
      if (!rendererRef.current) return '';
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) return '';

      const width = rendererRef.current.domElement.width;
      const height = rendererRef.current.domElement.height;
      canvas.width = width;
      canvas.height = height;

      const videoElement = arToolkitSourceRef.current?.domElement as HTMLVideoElement | undefined;
      if (videoElement) {
        context.drawImage(videoElement, 0, 0, width, height);
      }
      context.drawImage(rendererRef.current.domElement, 0, 0, width, height);
      return canvas.toDataURL('image/png');
    },
    placeModel,
    removeModel,
    switchModel: (resources: MMDResources) => {
      setOverrideResources(resources);
    },
    setARMode: (mode: ARMode) => {
      if (!arMode) {
        setInternalARMode(mode);
      }
      attachModelRoot(mode);
      onARModeChange?.(mode);
    },
    getARMode: () => resolvedARMode
  }));

  useEffect(() => {
    autoPlayRef.current = autoPlay || modelPlaced;
  }, [autoPlay, modelPlaced]);

  useEffect(() => {
    if (showSettings !== undefined) {
      setSettingsVisible(showSettings);
    }
  }, [showSettings]);

  useEffect(() => {
    if (cameraConfig?.facingMode) {
      if (cameraConfig.facingMode !== cameraFacing) {
        setCameraFacing(cameraConfig.facingMode);
        cleanupAR();
        setupAR(cameraConfig.facingMode).catch(() => undefined);
      }
    }
  }, [cameraConfig?.facingMode, cameraFacing, cleanupAR, setupAR]);

  useEffect(() => {
    if (!modelPresets.find((preset) => preset.id === selectedModelId)) {
      setSelectedModelId(modelPresets[0]?.id ?? '');
    }
  }, [modelPresets, selectedModelId]);

  useEffect(() => {
    if (!motionPresets.find((preset) => preset.id === selectedMotionId)) {
      setSelectedMotionId(motionPresets[0]?.id ?? '');
    }
  }, [motionPresets, selectedMotionId]);

  useEffect(() => {
    if (audioPresets && !audioPresets.find((preset) => preset.id === selectedAudioId)) {
      setSelectedAudioId(audioPresets[0]?.id ?? '');
    }
  }, [audioPresets, selectedAudioId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!rendererRef.current) {
      setupRenderer();
    }
    if (!arToolkitSourceRef.current) {
      setupAR()
        .then(() => {
          startRenderLoop();
        })
        .catch((err) => {
          const message = err instanceof Error ? err.message : 'Failed to initialize AR';
          setError(message);
          setIsLoading(false);
          onCameraError?.(err instanceof Error ? err : new Error(message));
        });
    } else {
      startRenderLoop();
    }

    const resizeObserver = new ResizeObserver(resize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
      cleanupAR();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      if (rendererRef.current) {
        rendererRef.current.dispose();
        rendererRef.current = null;
      }
      if (sceneRef.current && modelRootRef.current) {
        sceneRef.current.remove(modelRootRef.current);
      }
      if (mmdMeshRef.current) {
        if (mmdHelperRef.current) {
          mmdHelperRef.current.remove(mmdMeshRef.current);
        }
        disposeMesh(mmdMeshRef.current);
        mmdMeshRef.current = null;
      }
      mmdHelperRef.current = null;
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, [cleanupAR, onCameraError, resize, setupAR, setupRenderer, startRenderLoop]);

  useEffect(() => {
    attachModelRoot(resolvedARMode);
  }, [attachModelRoot, resolvedARMode]);

  useEffect(() => {
    if (resolvedResources) {
      loadMMDResources();
      updateAudio();
    } else if (modelPresets.length === 0) {
      const message = 'No model presets configured.';
      setError(message);
      setIsLoading(false);
      onError?.(new Error(message));
    }
  }, [loadMMDResources, modelPresets.length, onError, resolvedResources, updateAudio]);

  const mirroredStyle = mirrored ? { transform: 'scaleX(-1)' } : undefined;

  return (
    <div
      ref={containerRef}
      className={clsx('relative w-full h-full overflow-hidden bg-black', className)}
      style={style}
    >
      <div ref={videoContainerRef} className="absolute inset-0" style={mirroredStyle} />
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={mirroredStyle} />

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-white z-20">
          <div className="text-center">
            <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-white mx-auto mb-3" />
            <div>Initializing AR...</div>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-950/80 text-white z-20">
          <div className="text-center max-w-sm px-4">
            <div className="text-lg font-semibold mb-2">AR Error</div>
            <div className="text-sm text-red-200">{error}</div>
          </div>
        </div>
      )}

      {arReady && !error && (
        <>
          {resolvedARMode !== ARMode.Overlay && !modelPlaced && (
            <div className="absolute top-4 left-4 right-4 bg-black/70 text-white p-3 rounded-lg text-sm z-10">
              <div className="font-semibold mb-1">Marker Placement</div>
              <div className="text-gray-200">
                Align the marker in view, then tap "{placementText}" to place the model.
              </div>
              <div className="mt-2">
                {markerDetected ? (
                  <span className="text-green-400">Marker detected</span>
                ) : (
                  <span className="text-yellow-400">Waiting for marker...</span>
                )}
              </div>
            </div>
          )}

          <div className="absolute top-4 right-4 flex items-center space-x-2 z-10">
            <span
              className={clsx('h-2.5 w-2.5 rounded-full', cameraReady ? 'bg-green-400' : 'bg-red-400')}
              title="Camera"
            />
            <span
              className={clsx('h-2.5 w-2.5 rounded-full', arReady ? 'bg-green-400' : 'bg-red-400')}
              title="AR"
            />
            <span
              className={clsx('h-2.5 w-2.5 rounded-full', markerDetected ? 'bg-blue-400' : 'bg-gray-400')}
              title="Marker"
            />
          </div>

          <div className="absolute bottom-4 left-4 right-4 flex justify-center gap-3 z-10">
            <button
              onClick={() => setSettingsVisible((prev) => !prev)}
              className="px-4 py-2 rounded-lg bg-gray-700 text-white hover:bg-gray-600"
            >
              Settings
            </button>
            {resolvedARMode !== ARMode.Overlay && !modelPlaced && (
              <button
                onClick={placeModel}
                disabled={!markerDetected}
                className={clsx(
                  'px-5 py-2 rounded-lg text-white',
                  markerDetected ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-gray-500'
                )}
              >
                {placementText}
              </button>
            )}
            {modelPlaced && (
              <button
                onClick={removeModel}
                className="px-5 py-2 rounded-lg text-white bg-orange-600 hover:bg-orange-500"
              >
                Reset
              </button>
            )}
          </div>

          {settingsVisible && (
            <div className="absolute top-16 right-4 bg-black/80 text-white p-4 rounded-lg w-64 space-y-3 z-10">
              <div className="text-sm font-semibold">AR Settings</div>
              <label className="block text-xs text-gray-300">
                Model
                <select
                  value={selectedModelId}
                  onChange={(event) => {
                    setOverrideResources(null);
                    setSelectedModelId(event.target.value);
                  }}
                  className="mt-1 w-full bg-gray-700 text-white text-sm rounded px-2 py-1"
                >
                  {modelPresets.map((preset) => (
                    <option key={preset.id} value={preset.id}>
                      {preset.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-xs text-gray-300">
                Motion
                <select
                  value={selectedMotionId}
                  onChange={(event) => {
                    setOverrideResources(null);
                    setSelectedMotionId(event.target.value);
                  }}
                  className="mt-1 w-full bg-gray-700 text-white text-sm rounded px-2 py-1"
                >
                  {motionPresets.map((preset) => (
                    <option key={preset.id} value={preset.id}>
                      {preset.name}
                    </option>
                  ))}
                </select>
              </label>

              {audioPresets && audioPresets.length > 0 && (
                <label className="block text-xs text-gray-300">
                  Audio
                  <select
                    value={selectedAudioId}
                    onChange={(event) => {
                      setOverrideResources(null);
                      setSelectedAudioId(event.target.value);
                    }}
                    className="mt-1 w-full bg-gray-700 text-white text-sm rounded px-2 py-1"
                  >
                    {audioPresets.map((preset) => (
                      <option key={preset.id} value={preset.id}>
                        {preset.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              <label className="block text-xs text-gray-300">
                AR Mode
                <select
                  value={resolvedARMode}
                  onChange={(event) => {
                    const next = event.target.value as ARMode;
                    if (!arMode) {
                      setInternalARMode(next);
                    }
                    attachModelRoot(next);
                    onARModeChange?.(next);
                  }}
                  className="mt-1 w-full bg-gray-700 text-white text-sm rounded px-2 py-1"
                >
                  <option value={ARMode.Overlay}>Overlay</option>
                  <option value={ARMode.WorldFixed}>World Fixed</option>
                </select>
              </label>

              <label className="block text-xs text-gray-300">
                Camera
                <select
                  value={cameraFacing}
                  onChange={(event) => {
                    const next = event.target.value as 'user' | 'environment';
                    setCameraFacing(next);
                    cleanupAR();
                    setupAR(next).catch(() => undefined);
                  }}
                  className="mt-1 w-full bg-gray-700 text-white text-sm rounded px-2 py-1"
                >
                  <option value="environment">Back</option>
                  <option value="user">Front</option>
                </select>
              </label>
            </div>
          )}
        </>
      )}
    </div>
  );
});

MMDARApp.displayName = 'MMDARApp';

export default MMDARApp;

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
// @ts-ignore
import { MMDLoader } from 'three/examples/jsm/loaders/MMDLoader.js';
// @ts-ignore
import { MMDAnimationHelper } from 'three/examples/jsm/animation/MMDAnimationHelper.js';
// @ts-ignore
import { OutlineEffect } from 'three/examples/jsm/effects/OutlineEffect.js';
import { MMDPlayerProps } from '../types';
import { loadAmmo } from '../utils/ammo-loader';

export const MMDPlayer: React.FC<MMDPlayerProps> = ({
  modelUrl,
  vmdUrl,
  cameraUrl,
  audioUrl,
  physics = true,
  width = '100%',
  height = '100%',
  onLoad,
  onProgress,
  onError,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    let scene: THREE.Scene;
    let camera: THREE.PerspectiveCamera;
    let renderer: THREE.WebGLRenderer;
    let effect: OutlineEffect;
    let helper: MMDAnimationHelper;
    // Unused variables removed to fix lint errors
    // let ikHelper: THREE.Object3D;
    // let physicsHelper: THREE.Object3D;
    let clock: THREE.Clock;
    let animationId: number;

    const init = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load Ammo.js if physics is enabled
        if (physics) {
          await loadAmmo();
        }

        const container = containerRef.current!;
        const w = container.clientWidth;
        const h = container.clientHeight;

        // Scene
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0xffffff);

        // Camera
        camera = new THREE.PerspectiveCamera(45, w / h, 1, 2000);
        camera.position.z = 30;

        // Light
        const ambient = new THREE.AmbientLight(0x666666);
        scene.add(ambient);

        const directionalLight = new THREE.DirectionalLight(0x887766);
        directionalLight.position.set(-1, 1, 1).normalize();
        scene.add(directionalLight);

        // Renderer
        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(w, h);
        container.appendChild(renderer.domElement);

        // Effect
        effect = new OutlineEffect(renderer);

        // Helper
        helper = new MMDAnimationHelper({
          afterglow: 2.0,
        });

        // Loader
        const loader = new MMDLoader();

        // Load Model
        loader.load(
          modelUrl,
          (mesh: any) => { // Explicitly type mesh as any for now since MMDLoader types can be tricky
            scene.add(mesh);
            
            // Load VMD (Model Motion)
            if (vmdUrl) {
              loader.loadAnimation(
                vmdUrl,
                mesh,
                (animation: THREE.AnimationClip | THREE.AnimationClip[]) => {
                  helper.add(mesh, {
                    animation: animation as THREE.AnimationClip,
                    physics: physics,
                  });
                },
                (xhr: ProgressEvent) => {
                  if (onProgress) onProgress(xhr);
                },
                (err: unknown) => {
                    console.error('Error loading animation', err);
                    if (onError) onError(err);
                }
              );
            } else {
               helper.add(mesh, { physics: physics });
            }

            // Load Camera Motion
            if (cameraUrl) {
                loader.loadAnimation(
                    cameraUrl,
                    camera,
                    (cameraAnimation: THREE.AnimationClip | THREE.AnimationClip[]) => {
                        helper.add(camera, {
                            animation: cameraAnimation as THREE.AnimationClip,
                        });
                    },
                    undefined,
                    (err: unknown) => {
                        console.error('Error loading camera motion', err);
                        // Don't fail the whole load if camera fails
                    }
                );
            }

             // Load Audio
            if (audioUrl) {
                new THREE.AudioLoader().load(
                    audioUrl,
                    (buffer: AudioBuffer) => {
                        const listener = new THREE.AudioListener();
                        camera.add(listener);
                        const audio = new THREE.Audio(listener);
                        audio.setBuffer(buffer);
                        helper.add(audio, { delay: 0.0 });
                    },
                    undefined,
                    (err: unknown) => {
                        console.error('Error loading audio', err);
                    }
                );
            }

            if (onLoad) onLoad();
            setLoading(false);
          },
          (xhr: ProgressEvent) => {
            if (onProgress) onProgress(xhr);
          },
          (err: unknown) => {
            setError('Failed to load model');
            if (onError) onError(err);
            setLoading(false);
          }
        );

        clock = new THREE.Clock();

        const animate = () => {
          animationId = requestAnimationFrame(animate);
          helper.update(clock.getDelta());
          effect.render(scene, camera);
        };

        animate();

        // Resize handler
        const handleResize = () => {
            if (!container) return;
            const width = container.clientWidth;
            const height = container.clientHeight;
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            effect.setSize(width, height);
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
        }

      } catch (e) {
        console.error(e);
        setError('Initialization error');
        setLoading(false);
      }
      return undefined;
    };

    init();

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
      if (renderer) {
        renderer.dispose();
        const domElement = renderer.domElement;
        if (domElement && domElement.parentNode) {
             domElement.parentNode.removeChild(domElement);
        }
      }
      // Dispose scenes, materials, etc. could be added here
    };
  }, [modelUrl, vmdUrl, cameraUrl, audioUrl, physics]);

  return (
    <div 
      ref={containerRef} 
      style={{ width, height, position: 'relative', overflow: 'hidden' }}
    >
      {loading && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          background: '#f0f0f0',
          color: '#666',
          zIndex: 1
        }}>
          Loading MMD...
        </div>
      )}
      {error && (
         <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            background: '#ffeeee',
            color: '#cc0000',
            zIndex: 2
          }}>
            {error}
          </div>
      )}
    </div>
  );
};

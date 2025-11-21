export interface MMDPlayerProps {
  /**
   * URL to the PMX model file
   */
  modelUrl: string;

  /**
   * URL to the VMD motion file for the model
   */
  vmdUrl?: string;

  /**
   * URL to the VMD motion file for the camera
   */
  cameraUrl?: string;

  /**
   * URL to the audio file (wav, mp3)
   */
  audioUrl?: string;

  /**
   * Whether to enable physics simulation (requires Ammo.js)
   * @default true
   */
  physics?: boolean;

  /**
   * Width of the player
   * @default '100%'
   */
  width?: string | number;

  /**
   * Height of the player
   * @default '100%'
   */
  height?: string | number;

  /**
   * Callback when resources are loaded
   */
  onLoad?: () => void;

  /**
   * Callback for loading progress
   */
  onProgress?: (xhr: ProgressEvent) => void;

  /**
   * Callback for loading error
   */
  onError?: (error: unknown) => void;
}


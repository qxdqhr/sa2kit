import React, { useEffect, useRef, useState } from 'react';
import { RotateCcw, Save } from 'lucide-react';

interface ImageEditorProps {
  src: string;
  onClose: () => void;
  onSave: (dataUrl: string) => void;
}

export function ImageEditor({ src, onClose, onSave }: ImageEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [angle, setAngle] = useState(0);
  const [filter, setFilter] = useState('none');
  const [cropRect, setCropRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = src;
    img.onload = () => {
      imgRef.current = img;
      const c = canvasRef.current;
      if (!c) return;
      const ctx = c.getContext('2d')!;
      // fit canvas
      c.width = img.width;
      c.height = img.height;
      ctx.drawImage(img, 0, 0);
      setCropRect({ x: 0, y: 0, w: img.width, h: img.height });
    };
  }, [src]);

  useEffect(() => {
    const c = canvasRef.current;
    const img = imgRef.current;
    if (!c || !img) return;
    const ctx = c.getContext('2d')!;
    // clear
    ctx.save();
    ctx.clearRect(0, 0, c.width, c.height);
    // apply rotation and filter by drawing on an offscreen canvas
    ctx.filter = filter as any;
    ctx.translate(c.width / 2, c.height / 2);
    ctx.rotate((angle * Math.PI) / 180);
    ctx.translate(-c.width / 2, -c.height / 2);
    ctx.drawImage(img, 0, 0);
    ctx.restore();
    // crop indicator (optional)
    if (cropRect) {
      ctx.strokeStyle = 'rgba(255,255,255,0.8)';
      ctx.lineWidth = 4;
      ctx.strokeRect(cropRect.x, cropRect.y, cropRect.w, cropRect.h);
    }
  }, [angle, filter, cropRect]);

  function doSave() {
    const c = canvasRef.current;
    if (!c) return;
    let dataUrl = c.toDataURL('image/jpeg', 0.92);
    // if cropRect smaller than canvas, crop
    if (cropRect) {
      const tmp = document.createElement('canvas');
      tmp.width = cropRect.w;
      tmp.height = cropRect.h;
      const tctx = tmp.getContext('2d')!;
      tctx.drawImage(c, cropRect.x, cropRect.y, cropRect.w, cropRect.h, 0, 0, cropRect.w, cropRect.h);
      dataUrl = tmp.toDataURL('image/jpeg', 0.92);
    }
    onSave(dataUrl);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-60 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-4 max-w-3xl w-full">
        <div className="flex gap-2 items-center mb-2">
          <button className="btn" onClick={() => setAngle((a) => a - 90)} title="Rotate left">
            <RotateCcw />
          </button>
          <button className="btn" onClick={() => setAngle((a) => a + 90)} title="Rotate right">
            <RotateCcw className="rotate-180" />
          </button>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border rounded px-2 py-1"
          >
            <option value="none">Normal</option>
            <option value="grayscale(1)">Grayscale</option>
            <option value="brightness(1.2)">Brighten</option>
            <option value="contrast(1.2)">Contrast</option>
            <option value="sepia(0.6)">Sepia</option>
          </select>
          <div className="ml-auto flex gap-2">
            <button className="btn" onClick={doSave}>
              <Save /> 保存
            </button>
            <button className="btn" onClick={onClose}>
              取消
            </button>
          </div>
        </div>
        <div className="overflow-auto">
          <canvas ref={canvasRef} className="w-full border rounded" />
        </div>
      </div>
    </div>
  );
}

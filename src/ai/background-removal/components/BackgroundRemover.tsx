import React, { useState, useRef } from 'react';
import { useBackgroundRemoval } from '../hooks/useBackgroundRemoval';
import { Loader2, Upload, Download, Image as ImageIcon, X, Eraser } from 'lucide-react';

interface BackgroundRemoverProps {
  onResult?: (blob: Blob, url: string) => void;
  className?: string;
}

export const BackgroundRemover: React.FC<BackgroundRemoverProps> = ({
  onResult,
  className = '',
}) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { remove, isProcessing, progress, status, resultUrl, error } = useBackgroundRemoval();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);

    try {
      const { blob, url } = await remove(file);
      onResult?.(blob, url);
    } catch (err) {
      console.error('Background Removal Error:', err);
    }
  };

  const reset = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const downloadResult = () => {
    if (!resultUrl) return;
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = 'removed_background.png';
    a.click();
  };

  return (
    <div className={`p-6 border-2 border-dashed rounded-xl transition-all ${
      isProcessing ? 'border-purple-400 bg-purple-50/10' : 'border-gray-200 hover:border-purple-400'
    } ${className}`}>
      {!imagePreview ? (
        <div 
          className="flex flex-col items-center justify-center cursor-pointer space-y-4"
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="p-4 bg-purple-50 rounded-full text-purple-500">
            <Eraser size={32} />
          </div>
          <div className="text-center">
            <p className="text-lg font-medium text-gray-700">上传图片移除背景</p>
            <p className="text-sm text-gray-500">建议使用主体明确的图片</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">原图</p>
              <div className="relative rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                <img src={imagePreview} alt="Original" className="max-h-64 mx-auto object-contain" />
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">处理结果</p>
              <div className="relative rounded-lg overflow-hidden border border-gray-200 bg-grid-slate-100 bg-[size:20px_20px]">
                {resultUrl ? (
                  <img src={resultUrl} alt="Result" className="max-h-64 mx-auto object-contain animate-in fade-in zoom-in-95 duration-500" />
                ) : (
                  <div className="h-64 flex flex-col items-center justify-center text-gray-400">
                    {isProcessing ? (
                      <>
                        <Loader2 className="animate-spin text-purple-500 mb-2" size={32} />
                        <div className="w-32 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className="bg-purple-500 h-full transition-all duration-300"
                            style={{ width: `${progress * 100}%` }}
                          />
                        </div>
                        <p className="text-[10px] mt-2 font-mono uppercase">{status.replace(/-/g, ' ')}</p>
                      </>
                    ) : (
                      <span className="text-sm italic">等待处理...</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center pt-2">
            {!isProcessing && (
              <button 
                onClick={reset}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                <X size={16} />
                重新开始
              </button>
            )}
            
            {resultUrl && !isProcessing && (
              <button 
                onClick={downloadResult}
                className="flex items-center gap-2 px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg shadow-sm transition-all"
              >
                <Download size={16} />
                下载 PNG
              </button>
            )}
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
              处理失败: {error.message}
            </div>
          )}
        </div>
      )}

      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleFileChange}
        disabled={isProcessing}
      />
    </div>
  );
};








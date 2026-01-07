import React, { useState, useRef } from 'react';
import { useOCR } from '../hooks/useOCR';
import { Loader2, Upload, FileText, Image as ImageIcon, X } from 'lucide-react';

interface OCRScannerProps {
  onResult?: (text: string) => void;
  className?: string;
  language?: string;
}

export const OCRScanner: React.FC<OCRScannerProps> = ({
  onResult,
  className = '',
  language = 'eng',
}) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { recognize, isProcessing, progress, status, result, error } = useOCR({
    language,
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);

    try {
      const ocrResult = await recognize(file);
      onResult?.(ocrResult.text);
    } catch (err) {
      console.error('OCR Error:', err);
    }
  };

  const reset = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const mockEvent = { target: { files: [file] } } as unknown as React.ChangeEvent<HTMLInputElement>;
      handleFileChange(mockEvent);
    }
  };

  return (
    <div 
      className={`p-6 border-2 border-dashed rounded-xl transition-all ${
        isProcessing ? 'border-blue-400 bg-blue-50/10' : 'border-gray-200 hover:border-blue-400'
      } ${className}`}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {!imagePreview ? (
        <div 
          className="flex flex-col items-center justify-center cursor-pointer space-y-4"
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="p-4 bg-blue-50 rounded-full text-blue-500">
            <Upload size={32} />
          </div>
          <div className="text-center">
            <p className="text-lg font-medium text-gray-700">点击或拖拽图片进行 OCR 识别</p>
            <p className="text-sm text-gray-500">支持 JPG, PNG, WebP</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative group rounded-lg overflow-hidden border border-gray-200">
            <img 
              src={imagePreview} 
              alt="Preview" 
              className={`max-h-64 mx-auto object-contain transition-opacity ${isProcessing ? 'opacity-50' : 'opacity-100'}`}
            />
            {!isProcessing && (
              <button 
                onClick={reset}
                className="absolute top-2 right-2 p-1 bg-white/80 rounded-full hover:bg-white text-gray-600 shadow-sm"
              >
                <X size={18} />
              </button>
            )}
            
            {isProcessing && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/5">
                <Loader2 className="animate-spin text-blue-500 mb-2" size={32} />
                <div className="w-48 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-blue-500 h-full transition-all duration-300"
                    style={{ width: `${progress * 100}%` }}
                  />
                </div>
                <p className="text-xs font-medium text-blue-600 mt-2">
                  {status === 'initializing' ? '正在加载引擎...' : `识别中 ${Math.round(progress * 100)}%`}
                </p>
              </div>
            )}
          </div>

          {result && !isProcessing && (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center gap-2 mb-2 text-gray-600 font-medium">
                <FileText size={18} />
                <span>识别结果 (置信度: {Math.round(result.confidence)}%)</span>
              </div>
              <pre className="text-sm text-gray-800 whitespace-pre-wrap font-sans">
                {result.text}
              </pre>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
              识别失败: {error.message}
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










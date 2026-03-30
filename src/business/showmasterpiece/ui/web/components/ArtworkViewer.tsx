import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ImageIcon } from 'lucide-react';
import { ArtworkPage } from '../../../types';
import { Card, CardContent } from '@/components';
import { Button } from '@/components';
import { Badge } from '@/components';

interface ArtworkViewerProps {
  artwork: ArtworkPage;
  collectionId: number; // 添加collectionId
  onNext: () => void;
  onPrev: () => void;
  canGoNext: boolean;
  canGoPrev: boolean;
}

export const ArtworkViewer: React.FC<ArtworkViewerProps> = ({
  artwork,
  collectionId,
  onNext,
  onPrev,
  canGoNext,
  canGoPrev
}) => {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [imageSrc, setImageSrc] = useState<string>('');

  // 🚀 图片加载逻辑 - 优先使用imageUrl，不再支持Base64
  useEffect(() => {
    const loadImage = async () => {
      setImageLoading(true);
      setImageError(false);
      
      try {
        // 优先使用image（通过通用文件服务或API获取）
        if (artwork.image) {
          // 直接使用image，不再需要转换为blob
          setImageSrc(artwork.image);
          setImageLoading(false);
          return;
        }
        
        // 如果没有imageUrl，尝试使用fileId构建URL
        if (artwork.fileId) {
          const imageUrl = `/api/showmasterpiece/collections/${collectionId}/artworks/${artwork.id}/image`;
          setImageSrc(imageUrl);
          setImageLoading(false);
          return;
        }
        
        throw new Error('无图片数据');
      } catch (error) {
        console.error('图片加载失败:', error);
        setImageError(true);
      } finally {
        setImageLoading(false);
      }
    };

    loadImage();
  }, [artwork.id, artwork.image, artwork.fileId]); // 当作品ID或图片URL变化时重新加载

  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
  };

  const retryImageLoad = () => {
    setImageError(false);
    setImageLoading(true);
    // 重新触发useEffect中的图片加载逻辑
    const currentSrc = imageSrc;
    setImageSrc('');
    setTimeout(() => {
      if (currentSrc.startsWith('blob:')) {
        URL.revokeObjectURL(currentSrc);
      }
    }, 100);
  };

  return (
    <Card className="w-full max-w-full box-border mx-auto shadow-lg border-prussian-blue-200/30 bg-gradient-to-br from-white to-prussian-blue-900/5">
      <CardContent className="p-6 lg:p-5 md:p-4 sm:p-3">
        <div className="relative min-h-[600px] flex items-center justify-center bg-gradient-to-br from-prussian-blue-900/5 to-oxford-blue-100/10 rounded-lg overflow-hidden lg:min-h-[500px] md:min-h-[450px] sm:min-h-[350px] sm:rounded-md">
        {/* 图片加载状态 */}
        {imageLoading && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center gap-4 text-prussian-blue-600 text-center p-4">
            <div className="w-10 h-10 border-[3px] border-prussian-blue-300 border-t-moonstone rounded-full animate-spin"></div>
            <p>加载中...</p>
          </div>
        )}

        {/* 图片错误状态 */}
        {imageError && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center gap-4 text-prussian-blue-600 text-center p-4">
            <ImageIcon size={48} className="text-prussian-blue-500" />
            <p>图片加载失败</p>
            <Button 
              onClick={retryImageLoad}
              className="bg-gradient-to-r from-moonstone to-cerulean hover:from-cerulean hover:to-moonstone text-white shadow-lg transition-all duration-300"
            >
              重试
            </Button>
          </div>
        )}

        {/* 主图片 - 只有在有图片源且未出错时才显示 */}
        {imageSrc && !imageError && (
          <img
            src={imageSrc}
            alt={artwork.title}
            className={`w-full h-[600px] object-contain rounded-lg bg-gradient-to-br from-prussian-blue-900/5 to-oxford-blue-100/10 transition-opacity duration-300 select-none lg:h-[500px] md:h-[450px] sm:h-[350px] sm:rounded-md ${imageLoading ? 'opacity-0 absolute' : ''}`}
            style={{ WebkitUserDrag: 'none', touchAction: 'pinch-zoom' } as React.CSSProperties}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        )}
        
        {/* 翻页按钮 */}
        <Button
          onClick={onPrev}
          disabled={!canGoPrev}
          size="icon"
          variant="secondary"
          className="absolute top-1/2 left-4 transform -translate-y-1/2 bg-white/95 backdrop-blur-sm shadow-lg hover:bg-moonstone-900/10 hover:scale-105 hover:shadow-xl disabled:opacity-40 z-10 rounded-full p-3 border-prussian-blue-200 hover:border-moonstone/40 md:left-3 sm:left-2"
          aria-label="上一张"
        >
          <ChevronLeft size={24} />
        </Button>
        
        <Button
          onClick={onNext}
          disabled={!canGoNext}
          size="icon"
          variant="secondary"
          className="absolute top-1/2 right-4 transform -translate-y-1/2 bg-white/95 backdrop-blur-sm shadow-lg hover:bg-moonstone-900/10 hover:scale-105 hover:shadow-xl disabled:opacity-40 z-10 rounded-full p-3 border-prussian-blue-200 hover:border-moonstone/40 md:right-3 sm:right-2"
          aria-label="下一张"
        >
          <ChevronRight size={24} />
        </Button>
        </div>
        
        {/* 作品信息 */}
        <div className="mt-6 w-full max-w-full box-border lg:mt-5 md:mt-5 sm:mt-4">
          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-rich-black leading-tight lg:text-xl md:text-xl sm:text-lg sm:leading-5">
              {artwork.title}
            </h2>
            
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="border-moonstone/30 text-cerulean bg-moonstone-900/5">
                编号：{artwork.number}
              </Badge>
              
              {artwork.createdTime && (
                <Badge variant="outline" className="border-moonstone/30 text-cerulean bg-moonstone-900/5">
                  创作时间：{artwork.createdTime}
                </Badge>
              )}
              
              {artwork.theme && (
                <Badge variant="outline" className="border-moonstone/30 text-cerulean bg-moonstone-900/5">
                  主题：{artwork.theme}
                </Badge>
              )}
            </div>
            
            {artwork.description && (
              <p className="text-base text-prussian-blue-700 leading-relaxed sm:text-sm sm:leading-6">
                {artwork.description}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, ImageIcon, Grid3x3, X } from 'lucide-react';
import { ArtworkPage } from '../types';
import { Card, CardContent, Button, Badge } from '@/components';

interface MobileAlbumViewerProps {
  artworks: ArtworkPage[];
  collectionId: number;
  currentIndex: number;
  onIndexChange: (index: number) => void;
  onNext: () => void;
  onPrev: () => void;
  canGoNext: boolean;
  canGoPrev: boolean;
}

interface TouchState {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  isDragging: boolean;
  startTime: number;
}

export const MobileAlbumViewer: React.FC<MobileAlbumViewerProps> = ({
  artworks,
  collectionId,
  currentIndex,
  onIndexChange,
  onNext,
  onPrev,
  canGoNext,
  canGoPrev
}) => {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [imageSrc, setImageSrc] = useState<string>('');
  const [showThumbnails, setShowThumbnails] = useState(false);
  const [touchState, setTouchState] = useState<TouchState>({
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    isDragging: false,
    startTime: 0
  });

  const imageContainerRef = useRef<HTMLDivElement>(null);
  const thumbnailsRef = useRef<HTMLDivElement>(null);

  const currentArtwork = artworks[currentIndex];

  // 图片加载逻辑
  useEffect(() => {
    if (!currentArtwork) return;

    const loadImage = async () => {
      setImageLoading(true);
      setImageError(false);
      
      try {
        if (currentArtwork.image) {
          setImageSrc(currentArtwork.image);
          setImageLoading(false);
          return;
        }
        
        if (currentArtwork.fileId) {
          const imageUrl = `/api/showmasterpiece/collections/${collectionId}/artworks/${currentArtwork.id}/image`;
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
  }, [currentArtwork, collectionId]);

  // 触摸事件处理
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;
    setTouchState({
      startX: touch.clientX,
      startY: touch.clientY,
      currentX: touch.clientX,
      currentY: touch.clientY,
      isDragging: true,
      startTime: Date.now()
    });
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchState.isDragging) return;
    
    const touch = e.touches[0];
    if (!touch) return;
    const deltaX = touch.clientX - touchState.startX;
    const deltaY = touch.clientY - touchState.startY;
    
    // 如果主要是水平滑动，阻止默认行为以避免页面滚动
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
      e.preventDefault();
    }
    
    setTouchState(prev => ({
      ...prev,
      currentX: touch.clientX,
      currentY: touch.clientY
    }));
  }, [touchState.isDragging, touchState.startX, touchState.startY]);

  const handleTouchEnd = useCallback(() => {
    if (!touchState.isDragging) return;
    
    const deltaX = touchState.currentX - touchState.startX;
    const deltaY = touchState.currentY - touchState.startY;
    const deltaTime = Date.now() - touchState.startTime;
    
    // 判断是否为有效的滑动手势
    const isHorizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY);
    const isSignificantMove = Math.abs(deltaX) > 50;
    const isFastSwipe = deltaTime < 300 && Math.abs(deltaX) > 30;
    
    if (isHorizontalSwipe && (isSignificantMove || isFastSwipe)) {
      if (deltaX > 0 && canGoPrev) {
        // 向右滑动，显示上一张
        onPrev();
      } else if (deltaX < 0 && canGoNext) {
        // 向左滑动，显示下一张
        onNext();
      }
    }
    
    setTouchState({
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
      isDragging: false,
      startTime: 0
    });
  }, [touchState, canGoNext, canGoPrev, onNext, onPrev]);

  // 键盘导航
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && canGoPrev) {
        onPrev();
      } else if (e.key === 'ArrowRight' && canGoNext) {
        onNext();
      } else if (e.key === 'Escape') {
        setShowThumbnails(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canGoNext, canGoPrev, onNext, onPrev]);

  // 缩略图滚动到当前项
  useEffect(() => {
    if (showThumbnails && thumbnailsRef.current) {
      const thumbnailElement = thumbnailsRef.current.children[currentIndex] as HTMLElement;
      if (thumbnailElement) {
        thumbnailElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'nearest',
          inline: 'center'
        });
      }
    }
  }, [currentIndex, showThumbnails]);

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
    const currentSrc = imageSrc;
    setImageSrc('');
    setTimeout(() => {
      if (currentSrc.startsWith('blob:')) {
        URL.revokeObjectURL(currentSrc);
      }
    }, 100);
  };

  const toggleThumbnails = () => {
    setShowThumbnails(!showThumbnails);
  };

  const selectThumbnail = (index: number) => {
    onIndexChange(index);
    setShowThumbnails(false);
  };

  if (!currentArtwork) {
    return (
      <div className="flex items-center justify-center w-full h-full text-white">
        <span>暂无可展示的作品</span>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-rich-black to-oxford-blue">
      {/* 主图片查看器 */}
      <div 
        ref={imageContainerRef}
        className="relative w-full h-screen bg-gradient-to-br from-rich-black to-oxford-blue flex items-center justify-center"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* 图片加载状态 */}
        {imageLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-rich-black/50">
            <div className="flex flex-col items-center gap-4 text-white">
              <div className="w-10 h-10 border-[3px] border-prussian-blue-300 border-t-moonstone rounded-full animate-spin"></div>
              <p>加载中...</p>
            </div>
          </div>
        )}

        {/* 图片错误状态 */}
        {imageError && (
          <div className="absolute inset-0 flex items-center justify-center bg-rich-black/50">
            <div className="flex flex-col items-center gap-4 text-white text-center p-4">
              <ImageIcon size={48} className="text-moonstone" />
              <p>图片加载失败</p>
              <Button 
                onClick={retryImageLoad}
                className="bg-gradient-to-r from-moonstone to-cerulean hover:from-cerulean hover:to-moonstone text-white shadow-lg transition-all duration-300"
              >
                重试
              </Button>
            </div>
          </div>
        )}

        {/* 主图片 */}
        {imageSrc && !imageError && (
          <img
            src={imageSrc}
            alt={currentArtwork.title}
            className={`max-w-full max-h-full object-contain transition-opacity duration-300 select-none ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
            style={{ 
              WebkitUserDrag: 'none', 
              touchAction: 'pinch-zoom',
              userSelect: 'none'
            } as React.CSSProperties}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        )}

        {/* 导航按钮 */}
        <Button
          onClick={onPrev}
          disabled={!canGoPrev}
          size="icon"
          variant="secondary"
          className="absolute top-1/2 left-4 transform -translate-y-1/2 bg-rich-black/70 backdrop-blur-sm text-white border-moonstone/30 hover:bg-oxford-blue/80 disabled:opacity-40 z-10 rounded-full w-12 h-12 shadow-lg"
          aria-label="上一张"
        >
          <ChevronLeft size={24} />
        </Button>
        
        <Button
          onClick={onNext}
          disabled={!canGoNext}
          size="icon"
          variant="secondary"
          className="absolute top-1/2 right-4 transform -translate-y-1/2 bg-rich-black/70 backdrop-blur-sm text-white border-moonstone/30 hover:bg-oxford-blue/80 disabled:opacity-40 z-10 rounded-full w-12 h-12 shadow-lg"
          aria-label="下一张"
        >
          <ChevronRight size={24} />
        </Button>

        {/* 顶部控制栏 */}
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-rich-black/80 via-oxford-blue/40 to-transparent p-4 z-20">
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-moonstone/30 text-white border-moonstone/50 backdrop-blur-sm">
                {currentIndex + 1} / {artworks.length}
              </Badge>
            </div>
            <Button
              onClick={toggleThumbnails}
              size="icon"
              variant="ghost"
              className="text-white hover:bg-moonstone/30 rounded-full w-10 h-10 backdrop-blur-sm"
              aria-label="显示缩略图"
            >
              <Grid3x3 size={20} />
            </Button>
          </div>
        </div>

        {/* 底部信息栏 */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-rich-black/80 via-oxford-blue/40 to-transparent p-4 z-20">
          <div className="text-white">
            <h2 className="text-xl font-bold mb-2">{currentArtwork.title}</h2>
            <div className="flex flex-wrap gap-2 mb-2">
              <Badge variant="secondary" className="bg-moonstone/30 text-white border-moonstone/50 backdrop-blur-sm">
                编号：{currentArtwork.number}
              </Badge>
              {currentArtwork.createdTime && (
                <Badge variant="secondary" className="bg-moonstone/30 text-white border-moonstone/50 backdrop-blur-sm">
                  创作时间：{currentArtwork.createdTime}
                </Badge>
              )}
              {currentArtwork.theme && (
                <Badge variant="secondary" className="bg-moonstone/30 text-white border-moonstone/50 backdrop-blur-sm">
                  主题：{currentArtwork.theme}
                </Badge>
              )}
            </div>
            {currentArtwork.description && (
              <p className="text-sm text-white/90 leading-relaxed">
                {currentArtwork.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 缩略图网格覆盖层 */}
      {showThumbnails && (
        <div className="absolute inset-0 bg-gradient-to-br from-rich-black/95 to-oxford-blue/90 backdrop-blur-sm z-30 flex flex-col">
          {/* 缩略图头部 */}
          <div className="flex items-center justify-between p-4 border-b border-moonstone/30">
            <h3 className="text-white text-lg font-semibold">选择图片</h3>
            <Button
              onClick={() => setShowThumbnails(false)}
              size="icon"
              variant="ghost"
              className="text-white hover:bg-moonstone/30 rounded-full"
            >
              <X size={20} />
            </Button>
          </div>

          {/* 缩略图网格 */}
          <div 
            ref={thumbnailsRef}
            className="flex-1 p-4 overflow-y-auto grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 content-start"
          >
            {artworks.map((artwork, index) => (
              <button
                key={artwork.id}
                onClick={() => selectThumbnail(index)}
                className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                  index === currentIndex 
                    ? 'border-moonstone scale-95 shadow-lg shadow-moonstone/30' 
                    : 'border-prussian-blue-300/30 hover:border-moonstone/50'
                }`}
              >
                <img
                  src={artwork.image || `/api/showmasterpiece/collections/${collectionId}/artworks/${artwork.id}/image`}
                  alt={artwork.title}
                  className="w-full h-full object-cover"
                />
                {index === currentIndex && (
                  <div className="absolute inset-0 bg-moonstone/20 flex items-center justify-center">
                    <div className="w-6 h-6 bg-moonstone rounded-full flex items-center justify-center shadow-lg">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-rich-black/80 to-transparent p-1">
                  <div className="text-white text-xs text-center truncate">
                    {index + 1}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

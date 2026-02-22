import React, { useState, useEffect } from 'react';
import { ImageIcon } from 'lucide-react';
import { ArtworkPage } from '../types';

interface ThumbnailSidebarProps {
  pages: ArtworkPage[];
  currentPage: number;
  onPageSelect: (pageIndex: number) => void;
}

interface ThumbnailItemProps {
  page: ArtworkPage;
  index: number;
  isActive: boolean;
  onSelect: () => void;
}

// 🚀 懒加载缩略图组件
const ThumbnailItem: React.FC<ThumbnailItemProps> = ({ page, index, isActive, onSelect }) => {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [imageSrc, setImageSrc] = useState<string>('');
  const [isVisible, setIsVisible] = useState(false);

  // 使用Intersection Observer实现真正的懒加载
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    const element = document.getElementById(`thumbnail-${page.id}`);
    if (element) {
      observer.observe(element);
    }

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [page.id]);

  // 当组件可见时才加载图片
  useEffect(() => {
    if (!isVisible) return;

    const loadThumbnail = async () => {
      setImageLoading(true);
      setImageError(false);

      try {
        // 如果已有图片数据，直接使用
        if (page.image && page.image.trim() !== '') {
          setImageSrc(page.image);
          setImageLoading(false);
          return;
        }

        // 否则直接使用image
        if (page.image) {
          setImageSrc(page.image);
        } else {
          throw new Error('无图片数据');
        }
      } catch (error) {
        console.error('缩略图加载失败:', error);
        setImageError(true);
      } finally {
        setImageLoading(false);
      }
    };

    loadThumbnail();

    // 清理函数 - 不再需要清理blob URL
    return () => {
      // 不再使用blob URL，无需清理
    };
  }, [isVisible, page.id, page.image]);

  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
  };

  return (
    <button
      id={`thumbnail-${page.id}`}
      onClick={onSelect}
      className={`w-full p-2 border-2 border-prussian-blue-200/30 rounded-lg bg-gradient-to-br from-white to-prussian-blue-900/5 cursor-pointer transition-all duration-200 min-h-[44px] flex items-center justify-center hover:border-moonstone/40 hover:bg-moonstone-900/10 focus:outline-none focus:ring-2 focus:ring-moonstone focus:ring-offset-2 lg:flex-shrink-0 lg:min-w-[220px] lg:max-w-[220px] lg:p-3.5 md:min-w-[200px] md:max-w-[200px] md:p-3 md:min-h-12 sm:min-w-[180px] sm:max-w-[180px] sm:p-2.5 sm:rounded-md ${isActive ? 'border-moonstone bg-moonstone-900/10 shadow-lg shadow-moonstone/20' : ''}`}
      aria-label={`查看第 ${index + 1} 页：${page.title}`}
    >
      <div className="relative w-16 h-20 flex items-center justify-center bg-gradient-to-br from-prussian-blue-900/5 to-oxford-blue-100/10 rounded border border-prussian-blue-200/20 overflow-hidden flex-shrink-0 lg:w-11 lg:h-15 md:w-10 md:h-14 sm:w-9 sm:h-13 sm:rounded-sm">
        {/* 加载状态 */}
        {imageLoading && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
            <div className="w-4 h-4 border border-prussian-blue-300 border-t-moonstone rounded-full animate-spin"></div>
          </div>
        )}

        {/* 错误状态 */}
        {imageError && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center text-prussian-blue-400 text-xs">
            <ImageIcon size={20} />
          </div>
        )}

        {/* 缩略图 */}
        {imageSrc && !imageError && (
          <img
            src={imageSrc}
            alt={page.title}
            className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoading ? 'opacity-0 absolute' : ''}`}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        )}
      </div>
      
      {/* 作品名称和编号信息 */}
      <div className="text-left flex-1 min-w-0 lg:flex lg:flex-col lg:gap-1 lg:ml-3.5 md:ml-3 sm:ml-2.5">
        <h4 className="font-medium text-sm text-rich-black mb-1 overflow-hidden text-ellipsis whitespace-nowrap leading-tight lg:text-xs md:text-xs sm:text-xs sm:mb-0.5">{page.title}</h4>
        <p className="text-xs text-prussian-blue-600 mb-0 overflow-hidden text-ellipsis whitespace-nowrap lg:text-xs md:text-xs sm:text-xs">{page.number}</p>
      </div> 
    </button>
  );
};

export const ThumbnailSidebar: React.FC<ThumbnailSidebarProps> = ({
  pages,
  currentPage,
  onPageSelect
}) => {
  return (
    <div className="bg-gradient-to-br from-white to-prussian-blue-900/5 rounded-2xl shadow-2xl border border-prussian-blue-200/30 p-6 w-full max-w-full box-border mb-0 lg:p-5 lg:mb-4 md:p-4 md:mb-4 md:rounded-xl sm:p-3.5 sm:rounded-xl">
      <div className="flex justify-between items-center mb-4 lg:mb-3.5 md:mb-3 sm:mb-2.5">
        <h3 className="text-lg font-semibold text-rich-black mb-0 leading-tight lg:text-base md:text-base sm:text-sm">作品列表</h3>
        <span className="text-sm text-cerulean font-medium lg:text-sm md:text-sm sm:text-xs">
          {currentPage + 1} / {pages.length}
        </span>
      </div>
      
      <div className="flex flex-col gap-3 max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-moonstone/50 scrollbar-track-prussian-blue-100/30 lg:flex-row lg:gap-4 lg:max-h-none lg:overflow-x-auto lg:overflow-y-hidden lg:pb-2.5 lg:scroll-snap-x lg:scroll-smooth md:gap-3.5 md:pb-2 sm:gap-2.5 sm:pb-1.5">
        {pages.map((page, index) => (
          <ThumbnailItem
            key={page.id}
            page={page}
            index={index}
            isActive={index === currentPage}
            onSelect={() => onPageSelect(index)}
          />
        ))}
      </div>
    </div>
  );
}; 
/**
 * 画集卡片组件 (CollectionCard) - Tailwind CSS 版本
 * 
 * 这是一个用于展示单个画集信息的卡片组件，主要用于画集列表页面。
 * 
 * 主要功能：
 * - 画集封面图片展示（支持懒加载）
 * - 画集基本信息显示（标题、编号、分类、描述等）
 * - 作品页数统计显示
 * - 点击进入画集浏览
 * 
 * 性能优化特性：
 * - 图片懒加载（Intersection Observer API）
 * - 加载状态和错误处理
 * - Tailwind CSS 样式
 * 
 * @component
 */

import React, { useState, useRef, useEffect } from 'react';
import { Book, Eye, ImageIcon, ShoppingBag } from 'lucide-react';
import { ArtCollection, CollectionCategory } from '../types';
import { AddToCartButton } from './AddToCartButton';
import { Card, CardContent, Badge, Button } from '@/components';

/**
 * CollectionCard 组件的 Props 接口
 */
interface CollectionCardProps {
  /** 要展示的画集数据 */
  collection: ArtCollection;
  /** 用户ID */
  userId: number;
  /** 用户选择画集时的回调函数 */
  onSelect: (collection: ArtCollection) => void;
}

/**
 * 画集卡片组件主体
 * 
 * @param props - 组件属性
 * @param props.collection - 画集数据对象
 * @param props.userId - 用户ID
 * @param props.onSelect - 选择画集的回调函数
 * @returns React函数组件
 */
export const CollectionCard: React.FC<CollectionCardProps> = ({ 
  collection, 
  userId,
  onSelect 
}) => {
  // ===== 状态管理 =====
  
  /** 图片是否正在加载 */
  const [imageLoading, setImageLoading] = useState(true);
  
  /** 图片是否加载失败 */
  const [imageError, setImageError] = useState(false);
  
  /** 是否应该开始加载图片（懒加载控制） */
  const [shouldLoadImage, setShouldLoadImage] = useState(false);
  
  /** 卡片DOM元素的引用，用于懒加载观察 */
  const cardRef = useRef<HTMLDivElement>(null);

  // ===== 懒加载逻辑 =====
  
  /**
   * 使用 Intersection Observer API 实现图片懒加载
   * 当卡片进入视口时开始加载图片，提升页面性能
   */
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // 卡片进入视口，开始加载图片
            setShouldLoadImage(true);
            // 停止观察，避免重复触发
            observer.unobserve(entry.target);
          }
        });
      },
      { 
        rootMargin: '50px', // 提前50px开始加载，提升用户体验
        threshold: 0.1      // 10%的卡片可见时触发
      }
    );

    // 开始观察卡片元素
    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    // 清理函数：组件卸载时停止观察
    return () => {
      if (cardRef.current) {
        observer.unobserve(cardRef.current);
      }
    };
  }, []);

  // ===== 图片处理函数 =====
  
  /**
   * 图片加载成功处理函数
   * 隐藏加载状态，显示图片
   */
  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(false);
  };

  /**
   * 图片加载失败处理函数
   * 隐藏加载状态，显示错误状态
   */
  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
  };

  // ===== 渲染函数 =====
  
  /**
   * 渲染图片加载状态
   */
  const renderImageLoading = () => (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-prussian-blue-300 border-t-moonstone rounded-full animate-spin"></div>
    </div>
  );

  /**
   * 渲染图片错误状态
   */
  const renderImageError = () => (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-prussian-blue-600 text-sm text-center p-4">
      <ImageIcon size={32} className="text-prussian-blue-500" />
      <span>图片加载失败</span>
    </div>
  );

  /**
   * 渲染画集封面图片
   */
  const renderCoverImage = () => {
    if (!shouldLoadImage) {
      return renderImageLoading();
    }

    if (imageError || !collection.coverImage) {
      return renderImageError();
    }
    console.log('🔍 [CollectionCard] 渲染封面图片:', collection.coverImage, 'collection:', collection);
    return (
      <img
        src={collection.coverImage}
        alt={collection.title}
        className={`w-full h-full object-contain transition-opacity duration-300 ${
          imageLoading ? 'opacity-0 absolute' : 'opacity-100'
        }`}
        onLoad={handleImageLoad}
        onError={handleImageError}
      />
    );
  };

  /**
   * 格式化价格显示
   */
  const formatPrice = (price?: number): string => {
    if (price === undefined || price === null) {
      return '价格待定';
    }
    if (price === 0) {
      return '免费';
    }
    return `¥${price}`;
  };

  /**
   * 判断是否为商品类型
   */
  const isProduct = collection.category !== CollectionCategory.COLLECTION;

  return (
    <Card
      ref={cardRef}
      className={`overflow-hidden transition-all duration-300 transform w-full max-w-sm mx-auto group border-prussian-blue-200/30 shadow-lg hover:shadow-xl bg-gradient-to-br from-white to-prussian-blue-900/5 ${
        !(collection.pages && collection.pages.length > 0) 
          ? 'cursor-default' 
          : 'cursor-pointer hover:-translate-y-1 hover:shadow-moonstone/20 hover:border-moonstone/40'
      }`}
      onClick={(collection.pages && collection.pages.length > 0) ? () => onSelect(collection) : undefined}
    >
      {/* 图片容器 - B5尺寸适配 */}
      <div className="relative w-full bg-gradient-to-br from-prussian-blue-900/5 to-oxford-blue-100/10 flex items-center justify-center overflow-hidden aspect-[1/1.414]">
        {/* 图片覆盖层 */}
        <div className="absolute inset-0 bg-gradient-to-t from-rich-black/60 via-oxford-blue/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        {/* 画集徽章 */}
        <div className="absolute bottom-4 left-4 z-10">
          <Badge 
            variant="secondary" 
            className="bg-moonstone/90 text-white backdrop-blur-sm border-none hover:bg-cerulean/90 transition-colors shadow-lg"
          >
            {isProduct ? (
              <>
                <ShoppingBag size={16} className="mr-1" />
                商品
              </>
            ) : (
              <>
                <Book size={16} className="mr-1" />
                {collection.pages.length} 页
              </>
            )}
          </Badge>
        </div>

        {/* 封面图片 */}
        {renderCoverImage()}
      </div>

      {/* 内容区域 */}
      <CardContent className="p-6">
        {/* 标题 */}
        <h3 className="text-xl font-bold text-rich-black mb-2 line-clamp-2 group-hover:text-moonstone transition-colors">
          {collection.title}
        </h3>
        
        {/* 编号 */}
        <p className="text-prussian-blue-600 text-sm mb-1">
          编号：{collection.number}
        </p>
        
        {/* 分类 */}
        {collection.category && (
          <p className="text-prussian-blue-600 text-sm mb-1">
            分类：{collection.category.displayName}
          </p>
        )}
        
        {/* 价格 */}
        <p className="text-prussian-blue-700 text-sm mb-2 font-medium">
          价格：{formatPrice(collection.price)}
        </p>
        
        {/* 描述 */}
        {collection.description && (
          <p className="text-prussian-blue-500 text-sm mb-4 line-clamp-2">
            {collection.description}
          </p>
        )}
        
        {/* 操作按钮 */}
        <div className="flex gap-2">
          {/* 查看按钮 - 有作品内容时显示 */}
          {collection.pages && collection.pages.length > 0 && (
            <Button
              className="flex-1 bg-gradient-to-r from-moonstone to-cerulean hover:from-cerulean hover:to-moonstone text-white gap-2 shadow-lg transition-all duration-300 hover:shadow-moonstone/30"
              onClick={(e) => {
                e.stopPropagation();
                onSelect(collection);
              }}
            >
              <Eye size={16} />
              查看详情
            </Button>
          )}
          
          {/* 加入购物车按钮 - 没有作品内容时占满宽度 */}
          <AddToCartButton
            collection={collection}
            userId={userId}
            className={!(collection.pages && collection.pages.length > 0) ? "w-full" : "flex-1"}
            size="md"
          />
        </div>
      </CardContent>
    </Card>
  );
}; 
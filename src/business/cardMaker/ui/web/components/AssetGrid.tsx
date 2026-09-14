'use client';

import React, { useRef } from 'react';
import Image from 'next/image';
import type { AssetItem as AssetItemType } from '../../../domain/types';

interface AssetGridProps {
  assets: AssetItemType[];
  onSelect: (asset: AssetItemType) => void;
  onUpload?: (file: File) => void;
  selectedAssetId?: string;
  type?: 'avatar' | 'background' | 'decoration';
  category?: string;
  className?: string;
}

const getGridConfig = (category: string) => {
  const isAvatarGrid = category === 'base' || category === 'parts';
  return {
    columns: isAvatarGrid ? 4 : 3,
    gap: '12px',
    aspectRatio: isAvatarGrid ? '1' : '16/9',
  };
};

const UploadButton: React.FC<{
  onClick: () => void;
  category: string;
}> = ({ onClick, category }) => {
  const gridConfig = getGridConfig(category);
  const isAvatarGrid = category === 'base' || category === 'parts';

  const buttonStyle = {
    borderWidth: '2px',
    borderStyle: 'dashed',
    borderColor: '#fdba74',
    borderRadius: '12px',
    backgroundColor: '#ffffff',
    color: '#ff7849',
    transition: 'all 200ms ease',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    aspectRatio: gridConfig.aspectRatio,
    minHeight: isAvatarGrid ? '80px' : '60px',
  };

  return (
    <button
      onClick={onClick}
      style={buttonStyle}
      className="w-full flex flex-col items-center justify-center hover:bg-orange-50 hover:border-orange-500 transition-all duration-200"
    >
      <div
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          backgroundColor: 'rgba(255, 120, 73, 0.1)',
          marginBottom: '4px',
        }}
        className="flex items-center justify-center"
      >
        <span
          style={{
            fontSize: '18px',
            color: '#ea580c',
          }}
        >
          📷
        </span>
      </div>
      <span
        style={{
          fontSize: '12px',
          fontWeight: '600',
        }}
      >
        上传
      </span>
    </button>
  );
};

const AssetItem: React.FC<{
  asset: AssetItemType;
  isSelected: boolean;
  category: string;
  onClick: () => void;
}> = ({ asset, isSelected, category, onClick }) => {
  const gridConfig = getGridConfig(category);
  const isAvatarGrid = category === 'base' || category === 'parts';
  const showName = !isAvatarGrid;

  const itemStyle = {
    borderRadius: '12px',
    borderWidth: '2px',
    borderColor: isSelected ? '#ff7849' : '#f1f5f9',
    backgroundColor: '#ffffff',
    transition: 'all 200ms ease',
    boxShadow: isSelected ? '0 8px 20px rgba(255,120,73,0.3)' : '0 2px 4px rgba(0,0,0,0.05)',
    transform: isSelected ? 'scale(1.05)' : 'scale(1)',
    aspectRatio: gridConfig.aspectRatio,
    overflow: 'hidden',
  };

  return (
    <div className="relative cursor-pointer group" onClick={onClick}>
      <div
        style={itemStyle}
        className={`${!isSelected ? 'hover:border-orange-300 hover:shadow-md hover:-translate-y-1' : ''} transition-all duration-200`}
      >
        <Image
          src={asset.thumbnailUrl || asset.fileUrl}
          alt={asset.name}
          fill
          className="object-cover group-hover:scale-110 transition-transform duration-300"
        />

        {isSelected && (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              backgroundColor: 'rgba(255, 120, 73, 0.1)',
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                backgroundColor: '#ff7849',
                borderRadius: '50%',
                boxShadow: '0 8px 16px rgba(0,0,0,0.15)',
              }}
              className="flex items-center justify-center"
            >
              <span
                style={{
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: '700',
                }}
              >
                ✓
              </span>
            </div>
          </div>
        )}
      </div>

      {showName && (
        <p
          style={{
            fontSize: '12px',
            color: '#475569',
            marginTop: '8px',
            paddingLeft: '4px',
            paddingRight: '4px',
          }}
          className="text-center truncate"
        >
          {asset.name}
        </p>
      )}
    </div>
  );
};

const EmptyState: React.FC = () => (
  <div
    className="text-center"
    style={{
      padding: '32px 0',
      color: '#94a3b8',
    }}
  >
    <div
      style={{
        width: '64px',
        height: '64px',
        backgroundColor: '#f1f5f9',
        borderRadius: '50%',
        marginBottom: '12px',
      }}
      className="flex items-center justify-center mx-auto"
    >
      <span style={{ fontSize: '24px' }}>📸</span>
    </div>
    <p style={{ fontSize: '14px' }}>暂无资源</p>
  </div>
);

export const AssetGrid: React.FC<AssetGridProps> = ({
  assets,
  onSelect,
  onUpload,
  selectedAssetId,
  type = 'avatar',
  category = 'base',
  className = '',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const gridConfig = getGridConfig(category);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && onUpload) {
      onUpload(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const containerStyle = {
    padding: '16px',
    backgroundColor: 'rgba(248, 250, 252, 0.3)',
  };

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: `repeat(${gridConfig.columns}, 1fr)`,
    gap: gridConfig.gap,
  };

  return (
    <div style={containerStyle} className={className}>
      <div style={gridStyle}>
        {onUpload && (
          <div className="relative">
            <UploadButton
              onClick={() => fileInputRef.current?.click()}
              category={category}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        )}

        {assets.map((asset) => (
          <AssetItem
            key={asset.id}
            asset={asset}
            isSelected={selectedAssetId === asset.id}
            category={category}
            onClick={() => onSelect(asset)}
          />
        ))}
      </div>

      {assets.length === 0 && !onUpload && <EmptyState />}
    </div>
  );
};

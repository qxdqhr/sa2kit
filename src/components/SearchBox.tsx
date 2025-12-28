import React from 'react';

interface SearchBoxProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  placeholder?: string;
  size?: 'small' | 'medium' | 'large';
}

export const SearchBox: React.FC<SearchBoxProps> = ({ 
  searchQuery, 
  onSearchChange, 
  placeholder = "搜索实验项目的标题、描述或标签...",
  size = 'large'
}) => {
  // 根据尺寸获取样式
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          container: 'h-10',
          input: 'pl-10 pr-10 text-sm',
          icon: 'w-4 h-4',
          iconPosition: 'left-3',
          clearButton: 'right-2 w-6 h-6',
          clearIcon: 'w-3 h-3'
        };
      case 'medium':
        return {
          container: 'h-12',
          input: 'pl-12 pr-12 text-base',
          icon: 'w-5 h-5',
          iconPosition: 'left-3',
          clearButton: 'right-3 w-7 h-7',
          clearIcon: 'w-4 h-4'
        };
      case 'large':
      default:
        return {
          container: 'h-16',
          input: 'pl-6 pr-16 text-lg',
          icon: 'w-6 h-6',
          iconPosition: 'left-6',
          clearButton: 'right-4 w-8 h-8',
          clearIcon: 'w-4 h-4'
        };
    }
  };

  const styles = getSizeStyles();
  const isLarge = size === 'large';

  return (
    <div className="relative group w-full">
      {/* 搜索输入框 */}
      <input
        type="text"
        placeholder={placeholder}
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className={`
          w-full ${styles.container} ${styles.input}
          ${isLarge ? 'border-2 border-gray-200 rounded-2xl shadow-lg' : 'border border-gray-300 rounded-lg shadow-sm'}
          bg-white 
          focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 
          hover:border-gray-400 ${isLarge ? 'hover:shadow-xl' : 'hover:shadow-md'}
          transition-all duration-300 ease-out
          text-gray-800 placeholder-gray-500
          ${isLarge ? 'font-medium' : 'font-normal'}
        `}
      />

      {/* 清除按钮 */}
      {searchQuery && (
        <button
          onClick={() => onSearchChange('')}
          className={`
            absolute top-1/2 ${styles.clearButton} transform -translate-y-1/2
            z-10 group/clear
          `}
        >
          <div className={`
            ${styles.clearButton} flex items-center justify-center
            rounded-full 
            bg-gray-100 hover:bg-gray-200 
            transition-all duration-200 
            group-hover/clear:scale-105
          `}>
            <svg 
              className={`${styles.clearIcon} text-gray-500 group-hover/clear:text-gray-700`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M6 18L18 6M6 6l12 12" 
              />
            </svg>
          </div>
        </button>
      )}
    </div>
  );
}
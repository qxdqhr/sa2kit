import React from 'react';

/** 模型选项 */
export interface ModelOption {
  /** 唯一标识 */
  id: string;
  /** 显示名称 */
  name: string;
  /** 模型路径 */
  path: string | string[];
  /** 缩略图（可选） */
  thumbnail?: string;
}

/** 模型选择器设置属性 */
export interface ModelSelectorSettingsProps {
  /** 人物模型选项列表 */
  characterModels: ModelOption[];
  /** 场景模型选项列表 */
  stageModels: ModelOption[];
  /** 当前选中的人物模型 ID */
  selectedCharacterId: string;
  /** 当前选中的场景模型 ID */
  selectedStageId: string;
  /** 人物模型选择变化回调 */
  onCharacterChange: (id: string) => void;
  /** 场景模型选择变化回调 */
  onStageChange: (id: string) => void;
  /** 人物模型标签文字 */
  characterLabel?: string;
  /** 场景模型标签文字 */
  stageLabel?: string;
}

/**
 * ModelSelectorSettings - 模型选择器设置组件
 * 
 * 用于在设置界面中选择人物模型和场景模型
 */
export const ModelSelectorSettings: React.FC<ModelSelectorSettingsProps> = ({
  characterModels,
  stageModels,
  selectedCharacterId,
  selectedStageId,
  onCharacterChange,
  onStageChange,
  characterLabel = 'CHARACTER MODEL',
  stageLabel = 'STAGE MODEL',
}) => {
  return (
    <div className="space-y-6 sm:space-y-8">
      {/* 人物模型选择 */}
      <div className="space-y-3 sm:space-y-4">
        <div className="flex justify-between items-center text-xs sm:text-sm font-bold tracking-wider sm:tracking-widest" style={{ color: '#64748b' }}>
          <span>{characterLabel}</span>
          <span className="text-[10px] sm:text-xs opacity-60">
            {characterModels.find(m => m.id === selectedCharacterId)?.name || '未选择'}
          </span>
        </div>
        <div className="relative">
          <select
            value={selectedCharacterId}
            onChange={(e) => onCharacterChange(e.target.value)}
            className="w-full h-12 sm:h-14 px-4 sm:px-6 rounded-xl sm:rounded-2xl border appearance-none cursor-pointer font-medium text-sm sm:text-base transition-all focus:outline-none focus:ring-2 focus:ring-green-500/30 touch-manipulation"
            style={{
              background: 'linear-gradient(135deg, rgba(248, 250, 252, 0.98), rgba(226, 232, 240, 0.95))',
              borderColor: 'rgba(203, 213, 225, 0.6)',
              color: '#475569',
              boxShadow: '0 2px 8px rgba(100, 116, 139, 0.1)'
            }}
          >
            {characterModels.map((model) => (
              <option key={model.id} value={model.id}>
                {model.name}
              </option>
            ))}
          </select>
          {/* 下拉箭头 */}
          <div className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg 
              className="w-4 h-4 sm:w-5 sm:h-5" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              style={{ color: '#64748b' }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        {/* 缩略图预览（如果有） */}
        {characterModels.find(m => m.id === selectedCharacterId)?.thumbnail && (
          <div className="mt-2 flex justify-center">
            <img 
              src={characterModels.find(m => m.id === selectedCharacterId)?.thumbnail}
              alt="Character preview"
              className="h-20 sm:h-24 rounded-lg border object-cover"
              style={{ borderColor: 'rgba(203, 213, 225, 0.4)' }}
            />
          </div>
        )}
      </div>

      {/* 场景模型选择 */}
      <div className="space-y-3 sm:space-y-4">
        <div className="flex justify-between items-center text-xs sm:text-sm font-bold tracking-wider sm:tracking-widest" style={{ color: '#64748b' }}>
          <span>{stageLabel}</span>
          <span className="text-[10px] sm:text-xs opacity-60">
            {stageModels.find(m => m.id === selectedStageId)?.name || '未选择'}
          </span>
        </div>
        <div className="relative">
          <select
            value={selectedStageId}
            onChange={(e) => onStageChange(e.target.value)}
            className="w-full h-12 sm:h-14 px-4 sm:px-6 rounded-xl sm:rounded-2xl border appearance-none cursor-pointer font-medium text-sm sm:text-base transition-all focus:outline-none focus:ring-2 focus:ring-green-500/30 touch-manipulation"
            style={{
              background: 'linear-gradient(135deg, rgba(248, 250, 252, 0.98), rgba(226, 232, 240, 0.95))',
              borderColor: 'rgba(203, 213, 225, 0.6)',
              color: '#475569',
              boxShadow: '0 2px 8px rgba(100, 116, 139, 0.1)'
            }}
          >
            {stageModels.map((model) => (
              <option key={model.id} value={model.id}>
                {model.name}
              </option>
            ))}
          </select>
          {/* 下拉箭头 */}
          <div className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg 
              className="w-4 h-4 sm:w-5 sm:h-5" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              style={{ color: '#64748b' }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        {/* 缩略图预览（如果有） */}
        {stageModels.find(m => m.id === selectedStageId)?.thumbnail && (
          <div className="mt-2 flex justify-center">
            <img 
              src={stageModels.find(m => m.id === selectedStageId)?.thumbnail}
              alt="Stage preview"
              className="h-20 sm:h-24 rounded-lg border object-cover"
              style={{ borderColor: 'rgba(203, 213, 225, 0.4)' }}
            />
          </div>
        )}
      </div>

      {/* 提示信息 */}
      <div className="pt-3 sm:pt-4 flex items-center justify-center gap-2 opacity-50 italic text-[10px] sm:text-xs border-t" style={{ borderColor: 'rgba(203, 213, 225, 0.3)' }}>
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>选择的模型将应用到所有场景</span>
      </div>
    </div>
  );
};

ModelSelectorSettings.displayName = 'ModelSelectorSettings';

export default ModelSelectorSettings;


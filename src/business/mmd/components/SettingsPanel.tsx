import React from 'react';
import { X, Check, Image as ImageIcon, Music, Video, User } from 'lucide-react';
import { MMDResourceItem, MMDResourceOptions, ResourceOption } from '../types';
import { clsx } from 'clsx';

interface SettingsPanelProps {
  mode: 'list' | 'options';
  
  // List Mode Props
  items?: MMDResourceItem[];
  currentId?: string;
  onSelectId?: (id: string) => void;
  
  // Options Mode Props
  options?: MMDResourceOptions;
  currentSelection?: {
    modelId?: string;
    motionId?: string;
    cameraId?: string;
    audioId?: string;
    stageId?: string;
  };
  onSelectOption?: (type: 'models'|'motions'|'cameras'|'audios'|'stages', id: string) => void;
  
  onClose: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  mode,
  items,
  currentId,
  onSelectId,
  options,
  currentSelection,
  onSelectOption,
  onClose,
}) => {
  
  const renderListMode = () => {
    if (!items) return null;
    return (
      <div className="grid grid-cols-1 gap-2 p-4 sm:grid-cols-2">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelectId?.(item.id)}
            className={clsx('group flex items-center gap-3 rounded-lg p-3 transition-all', currentId === item.id 
                ? 'bg-blue-500/20 ring-1 ring-blue-500' 
                : 'bg-white/5 hover:bg-white/10')}
          >
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded bg-black/20 overflow-hidden">
              {item.thumbnail ? (
                <img src={item.thumbnail} alt={item.name} className="h-full w-full object-cover" />
              ) : (
                <Video size={20} className="opacity-50" />
              )}
            </div>
            <div className="flex-1 text-left">
              <div className={clsx('font-medium', currentId === item.id ? 'text-blue-400' : 'text-white')}>
                {item.name}
              </div>
              {item.description && (
                <div className="text-xs text-white/50 truncate">{item.description}</div>
              )}
            </div>
            {currentId === item.id && <Check size={16} className="text-blue-400" />}
          </button>
        ))}
      </div>
    );
  };

  const renderOptionGroup = (
    title: string, 
    icon: React.ReactNode, 
    type: 'models'|'motions'|'cameras'|'audios'|'stages',
    list: ResourceOption[] = [],
    currentVal?: string
  ) => {
    if (!list || list.length === 0) return null;
    
    return (
      <div className="mb-6">
        <div className="mb-3 flex items-center gap-2 text-sm font-medium text-white/70">
          {icon}
          <span>{title}</span>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {list.map(opt => (
            <button
              key={opt.id}
              onClick={() => onSelectOption?.(type, opt.id)}
              className={clsx('relative flex flex-col items-center gap-2 rounded-lg p-2 text-center transition-all', currentVal === opt.id 
                  ? 'bg-blue-500/20 ring-1 ring-blue-500' 
                  : 'bg-white/5 hover:bg-white/10')}
            >
              {opt.thumbnail ? (
                 <img src={opt.thumbnail} alt={opt.name} className="h-16 w-full rounded object-cover bg-black/20" />
              ) : (
                 <div className="flex h-16 w-full items-center justify-center rounded bg-black/20">
                   <div className="text-xs opacity-30">{opt.name.slice(0, 2)}</div>
                 </div>
              )}
              <div className={clsx('w-full truncate text-xs', currentVal === opt.id ? 'text-blue-400' : 'text-white/80')}>
                {opt.name}
              </div>
              {currentVal === opt.id && (
                <div className="absolute top-1 right-1 rounded-full bg-blue-500 p-0.5">
                  <Check size={10} className="text-white" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderOptionsMode = () => {
    if (!options) return null;
    return (
      <div className="p-4">
        {renderOptionGroup('模型', <User size={16} />, 'models', options.models, currentSelection?.modelId)}
        {renderOptionGroup('动作', <Video size={16} />, 'motions', options.motions, currentSelection?.motionId)}
        {renderOptionGroup('镜头', <ImageIcon size={16} />, 'cameras', options.cameras, currentSelection?.cameraId)}
        {renderOptionGroup('音频', <Music size={16} />, 'audios', options.audios, currentSelection?.audioId)}
        {renderOptionGroup('舞台', <ImageIcon size={16} />, 'stages', options.stages, currentSelection?.stageId)}
      </div>
    );
  };

  return (
    <div className="absolute right-0 top-0 h-full w-full max-w-sm transform bg-[#1a1a1e]/95 backdrop-blur-md shadow-2xl transition-transform duration-300 ease-in-out overflow-y-auto z-20 border-l border-white/10">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-[#1a1a1e]/95 p-4 backdrop-blur-md">
        <h2 className="text-lg font-semibold text-white">
          {mode === 'list' ? '播放列表' : '自定义场景'}
        </h2>
        <button 
          onClick={onClose}
          className="rounded-full p-2 text-white/50 hover:bg-white/10 hover:text-white"
        >
          <X size={20} />
        </button>
      </div>
      
      <div className="pb-20">
        {mode === 'list' ? renderListMode() : renderOptionsMode()}
      </div>
    </div>
  );
};


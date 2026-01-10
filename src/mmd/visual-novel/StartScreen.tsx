import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

export interface StartScreenProps {
  /** 是否显示开始界面 */
  showStartScreen?: boolean;
  /** 脚本名称 */
  scriptName?: string;
  /** 开始按钮文本 */
  startText?: string;
  /** 设置按钮文本 */
  settingsText?: string;
  /** 关于按钮文本 */
  aboutText?: string;
  /** 点击开始回调 */
  onStart?: () => void;
  /** 自定义类名 */
  className?: string;
  /** 自定义设置面板内容 */
  customSettingsContent?: React.ReactNode;
  /** 自定义关于面板内容 */
  customAboutContent?: React.ReactNode;
}

/**
 * VNModal - 简单的弹窗组件，用于设置和关于
 */
const VNModal: React.FC<{
  title: string;
  show: boolean;
  onClose: () => void;
  children: React.ReactNode;
}> = ({ title, show, onClose, children }) => {
  if (!show) return null;

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center backdrop-blur-xl z-[1000] pointer-events-auto transition-all animate-in fade-in zoom-in-95 duration-300 px-4"
      style={{ background: 'rgba(100, 116, 139, 0.3)' }}
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg p-4 sm:p-6 md:p-8 rounded-3xl sm:rounded-[2.5rem] border relative overflow-hidden max-h-[90vh] overflow-y-auto"
        style={{
          background: 'linear-gradient(135deg, rgba(248, 250, 252, 0.98), rgba(241, 245, 249, 0.95))',
          backdropFilter: 'blur(40px) saturate(200%)',
          WebkitBackdropFilter: 'blur(40px) saturate(200%)',
          borderColor: 'rgba(203, 213, 225, 0.8)',
          boxShadow: '0 20px 80px rgba(100, 116, 139, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.8)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 装饰性背景光晕 */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-slate-300/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-slate-400/15 rounded-full blur-3xl pointer-events-none" />

        {/* 标题 - 移动端优化 */}
        <div className="flex items-center justify-between mb-6 sm:mb-8 relative">
          <div className="flex flex-col">
            <h2 className="text-xl sm:text-2xl font-bold tracking-wider drop-shadow-sm" style={{ color: '#22c55e' }}>{title}</h2>
            <div className="h-1 sm:h-1.5 w-12 sm:w-16 bg-green-500/80 rounded-full mt-2 shadow-[0_0_10px_rgba(34,197,94,0.4)]" />
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all border shadow-inner touch-manipulation shrink-0"
            style={{
              background: 'rgba(241, 245, 249, 0.8)',
              borderColor: 'rgba(203, 213, 225, 0.6)',
              color: '#64748b'
            }}
          >
            ✕
          </button>
        </div>
        
        {/* 内容 - 移动端优化 */}
        <div className="leading-relaxed max-h-[40vh] sm:max-h-[50vh] overflow-y-auto pr-2 sm:pr-4 custom-scrollbar relative font-medium text-sm sm:text-base" style={{ color: '#475569' }}>
          {children}
        </div>
        
        {/* 确定按钮 - 移动端优化 */}
        <div className="mt-6 sm:mt-10 flex justify-center relative">
          <button
            onClick={onClose}
            className="px-10 sm:px-14 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl font-bold transition-all border hover:scale-105 active:scale-95 tracking-[0.15em] sm:tracking-[0.2em] uppercase text-xs sm:text-sm touch-manipulation"
            style={{
              background: 'linear-gradient(135deg, rgba(248, 250, 252, 0.98), rgba(226, 232, 240, 0.95))',
              borderColor: 'rgba(203, 213, 225, 0.8)',
              color: '#22c55e',
              boxShadow: '0 4px 16px rgba(100, 116, 139, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.8)'
            }}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * StartScreen - 开始界面组件
 * 
 * 用于 MMD Visual Novel 的开始界面显示
 */
export const StartScreen: React.FC<StartScreenProps> = ({
  showStartScreen = false,
  scriptName = '',
  startText = '开始游戏',
  settingsText = '游戏设置',
  aboutText = '关于作品',
  onStart,
  className = '',
  customSettingsContent,
  customAboutContent,
}) => {
  const [isMounted, setIsMounted] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;
  if (!showStartScreen) return null;

  const content = (
    <div
      className={`fixed inset-0 w-screen h-screen flex items-center justify-center overflow-hidden ${className}`}
      style={{
        zIndex: 999999,
        pointerEvents: 'auto',
        backgroundColor: '#f1f5f9',
        margin: 0,
        padding: 0,
      }}
    >
      {/* 动态明亮背景层 */}
      <div className="absolute inset-0 w-full h-full overflow-hidden">
        {/* 中心扩散光辉 */}
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150vw] h-[150vw] opacity-20 pointer-events-none"
          style={{
            background: 'radial-gradient(circle at center, rgba(226, 232, 240, 0.6) 0%, rgba(203, 213, 225, 0.3) 30%, transparent 70%)',
            filter: 'blur(60px)',
            animation: 'pulse 10s ease-in-out infinite'
          }}
        />
        
        {/* 漂浮的灰色星云 */}
        <div className="absolute inset-0 transition-opacity duration-1000">
          <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-slate-300/20 rounded-full blur-[120px] animate-blob" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-slate-400/15 rounded-full blur-[120px] animate-blob animation-delay-2000" />
          <div className="absolute top-[20%] right-[10%] w-[40%] h-[40%] bg-slate-300/15 rounded-full blur-[100px] animate-blob animation-delay-4000" />
        </div>

        {/* 密集的微粒效果 - 移动端减少数量 */}
        <div className="absolute inset-0 opacity-30">
          {[...Array(typeof window !== 'undefined' && window.innerWidth < 768 ? 20 : 40)].map((_, i) => (
            <div 
              key={i}
              className="absolute bg-slate-400/60 rounded-full"
              style={{
                width: Math.random() * 3 + 1 + 'px',
                height: Math.random() * 3 + 1 + 'px',
                top: Math.random() * 100 + '%',
                left: Math.random() * 100 + '%',
                boxShadow: '0 0 10px rgba(148, 163, 184, 0.3)',
                animation: `floatParticle ${Math.random() * 10 + 10}s linear infinite`,
                animationDelay: `-${Math.random() * 20}s`
              }}
            />
          ))}
        </div>
      </div>

      {/* 主内容区域 - 移动端优化 */}
      <div className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 flex flex-col items-center">
        
        {/* 标题区域 - 响应式间距 */}
        <div className="text-center mb-12 sm:mb-20 md:mb-32 group flex flex-col items-center">
          {/* 上装饰线 - 移动端缩小 */}
          <div className="w-24 sm:w-40 h-px bg-gradient-to-r from-transparent via-slate-400/60 to-transparent mb-6 sm:mb-10 shadow-[0_0_15px_rgba(148,163,184,0.3)]" />
          
          {/* 标题 - 响应式字体 */}
          <h1
            className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-black tracking-[0.1em] sm:tracking-[0.15em] leading-tight select-none px-4"
            style={{
              color: '#22c55e',
              filter: 'drop-shadow(0 0 20px rgba(34, 197, 94, 0.4))',
              textShadow: '0 4px 12px rgba(100, 116, 139, 0.3)'
            }}
          >
            {scriptName || 'VISUAL NOVEL'}
          </h1>
          
          {/* 下装饰区 - 响应式 */}
          <div className="mt-6 sm:mt-10 flex flex-col items-center gap-3 sm:gap-4">
            <div className="h-0.5 sm:h-1 w-20 sm:w-32 bg-green-500 rounded-full opacity-80 shadow-[0_0_20px_rgba(34,197,94,0.5)]" />
            <span className="text-xs sm:text-sm md:text-base tracking-[0.5em] sm:tracking-[0.8em] font-medium uppercase translate-x-[0.25em] sm:translate-x-[0.4em]" style={{ color: '#64748b' }}>
              Adventure System
            </span>
          </div>
        </div>

        {/* 交互按钮区 - 移动端优化 */}
        <div className="flex flex-col gap-6 sm:gap-10 items-center w-full max-w-sm px-4 sm:px-0">
          
          {/* 核心开始按钮 - 响应式高度 */}
          <button
            onClick={onStart}
            className="group relative w-full h-16 sm:h-20 flex items-center justify-center transition-all duration-500 active:scale-95 touch-manipulation"
          >
            {/* 按钮底色 */}
            <div 
              className="absolute inset-0 backdrop-blur-2xl border-2 rounded-3xl transition-all duration-500 group-hover:-inset-1"
              style={{
                background: 'linear-gradient(135deg, rgba(248, 250, 252, 0.98), rgba(226, 232, 240, 0.95))',
                borderColor: 'rgba(203, 213, 225, 0.8)',
                boxShadow: '0 8px 40px rgba(148, 163, 184, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.8)'
              }}
            />
            
            {/* 流光特效 */}
            <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-gradient-to-r from-transparent via-slate-300/30 to-transparent -skew-x-[25deg] -translate-x-[200%] group-hover:translate-x-[200%] transition-transform duration-1000 ease-in-out" />
            </div>
            
            <div className="relative flex items-center gap-3 sm:gap-6">
              <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-green-500 animate-ping opacity-75" />
              <span className="text-lg sm:text-2xl font-black tracking-[0.3em] sm:tracking-[0.4em] drop-shadow-sm" style={{ color: '#22c55e' }}>{startText}</span>
              <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-green-600 animate-ping opacity-75" />
            </div>
          </button>

          {/* 功能按钮组 - 移动端优化 */}
          <div className="flex gap-4 sm:gap-8 w-full justify-center">
            {[
              { text: settingsText, onClick: () => setShowSettings(true) },
              { text: aboutText, onClick: () => setShowAbout(true) }
            ].map((btn, idx) => (
              <button
                key={idx}
                onClick={btn.onClick}
                className="group relative flex-1 h-12 sm:h-14 flex items-center justify-center transition-all duration-300 active:scale-95 overflow-hidden rounded-xl sm:rounded-2xl touch-manipulation"
              >
                <div 
                  className="absolute inset-0 backdrop-blur-xl border transition-all duration-300"
                  style={{
                    background: 'linear-gradient(135deg, rgba(241, 245, 249, 0.95), rgba(226, 232, 240, 0.9))',
                    borderColor: 'rgba(203, 213, 225, 0.6)',
                    boxShadow: '0 4px 16px rgba(100, 116, 139, 0.15)'
                  }}
                />
                <span className="relative text-xs sm:text-sm md:text-base font-bold tracking-[0.15em] sm:tracking-[0.25em] transition-colors uppercase" style={{ color: '#64748b' }}>
                  {btn.text}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 固定到底部的版本信息 - 移动端优化 */}
      <div className="fixed bottom-4 sm:bottom-10 left-0 right-0 text-center pointer-events-none select-none px-4">
        <div className="inline-block px-3 sm:px-6 py-1.5 sm:py-2 rounded-full backdrop-blur-md border" style={{
          background: 'rgba(248, 250, 252, 0.8)',
          borderColor: 'rgba(203, 213, 225, 0.3)'
        }}>
          <span className="text-[8px] sm:text-[10px] md:text-xs tracking-[0.3em] sm:tracking-[0.5em] font-light uppercase" style={{ color: 'rgba(100, 116, 139, 0.5)' }}>
            Ver 1.6.2 — ENGINE POWERED BY SA2KIT
          </span>
        </div>
      </div>

      {/* 弹窗内容 */}
      <VNModal title={settingsText} show={showSettings} onClose={() => setShowSettings(false)}>
        {customSettingsContent ? (
          <div className="py-2 sm:py-4">
            {customSettingsContent}
          </div>
        ) : (
          <div className="space-y-6 sm:space-y-8 py-2 sm:py-4">
            <div className="space-y-3 sm:space-y-4">
              <div className="flex justify-between items-center text-xs sm:text-sm font-bold tracking-wider sm:tracking-widest" style={{ color: '#64748b' }}>
                <span>MUSIC VOLUME</span>
                <span>80%</span>
              </div>
              <div className="h-2.5 sm:h-3 rounded-full p-0.5 border" style={{ background: 'rgba(241, 245, 249, 0.5)', borderColor: 'rgba(203, 213, 225, 0.4)' }}>
                <div className="h-full w-[80%] rounded-full" style={{ background: 'linear-gradient(to right, #22c55e, #4ade80)', boxShadow: '0 0 15px rgba(34, 197, 94, 0.5)' }} />
              </div>
            </div>
            
            <div className="space-y-3 sm:space-y-4">
              <div className="flex justify-between items-center text-xs sm:text-sm font-bold tracking-wider sm:tracking-widest" style={{ color: '#64748b' }}>
                <span>TEXT SPEED</span>
                <span>NORMAL</span>
              </div>
              <div className="flex gap-2 sm:gap-3">
                {['SLOW', 'NORMAL', 'FAST'].map((s, i) => (
                  <div 
                    key={s} 
                    className="flex-1 py-2.5 sm:py-3 rounded-lg sm:rounded-xl border text-center text-[10px] sm:text-xs font-bold transition-all cursor-pointer touch-manipulation"
                    style={i===1 ? {
                      background: 'rgba(34, 197, 94, 0.15)',
                      borderColor: '#22c55e',
                      color: '#22c55e'
                    } : {
                      background: 'rgba(241, 245, 249, 0.5)',
                      borderColor: 'rgba(203, 213, 225, 0.4)',
                      color: 'rgba(100, 116, 139, 0.6)'
                    }}
                  >
                    {s}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="pt-3 sm:pt-4 flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-0 opacity-50 italic text-[10px] sm:text-xs border-t" style={{ borderColor: 'rgba(203, 213, 225, 0.3)' }}>
              <span>Auto Save Enabled</span>
              <span>Cloud Sync Active</span>
            </div>
          </div>
        )}
      </VNModal>

      <VNModal title={aboutText} show={showAbout} onClose={() => setShowAbout(false)}>
        {customAboutContent ? (
          <div className="py-2 sm:py-4">
            {customAboutContent}
          </div>
        ) : (
          <div className="space-y-6 sm:space-y-8 py-2 sm:py-4">
            <div className="flex items-center gap-3 sm:gap-6 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border" style={{ background: 'rgba(241, 245, 249, 0.6)', borderColor: 'rgba(203, 213, 225, 0.4)' }}>
              <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl flex items-center justify-center text-2xl sm:text-3xl font-black text-white shadow-lg shrink-0" style={{ background: 'linear-gradient(to bottom right, #22c55e, #4ade80)' }}>
                S2
              </div>
              <div>
                <h3 className="text-lg sm:text-2xl font-black tracking-tight" style={{ color: '#22c55e' }}>{scriptName || 'Project SA2'}</h3>
                <p className="text-[10px] sm:text-xs font-bold tracking-wider sm:tracking-widest mt-1 uppercase" style={{ color: 'rgba(100, 116, 139, 0.6)' }}>Visual Novel Experience</p>
              </div>
            </div>
            
            <div className="space-y-3 sm:space-y-4 px-1 sm:px-2">
              <p className="font-medium leading-relaxed text-sm sm:text-base" style={{ color: '#475569' }}>
                采用 sa2kit 引擎构建的新一代实时 3D 视觉小说。结合了 MMD 实时渲染技术与交互式剧情分支系统，致力于打造极致的沉浸式叙事体验。
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4 pt-4 sm:pt-6 border-t" style={{ borderColor: 'rgba(203, 213, 225, 0.3)' }}>
              <div className="flex flex-col gap-1">
                <span className="text-[9px] sm:text-[10px] font-bold tracking-wider sm:tracking-widest" style={{ color: 'rgba(100, 116, 139, 0.5)' }}>DEVELOPER</span>
                <span className="text-xs font-bold" style={{ color: '#64748b' }}>SA2KIT TEAM</span>
              </div>
              <div className="flex flex-col gap-1 text-right">
                <span className="text-[9px] sm:text-[10px] font-bold tracking-wider sm:tracking-widest" style={{ color: 'rgba(100, 116, 139, 0.5)' }}>ENGINE</span>
                <span className="text-xs font-bold" style={{ color: '#64748b' }}>THREE.JS / REACT</span>
              </div>
            </div>
          </div>
        )}
      </VNModal>

      {/* 注入所需的关键帧动画 */}
      <style>{`
        @keyframes floatParticle {
          from { transform: translateY(0) translateX(0); opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          to { transform: translateY(-100vh) translateX(50px); opacity: 0; }
        }
        @keyframes blob {
          0%, 100% { transform: scale(1); opacity: 0.1; }
          50% { transform: scale(1.2); opacity: 0.2; }
        }
        .animate-blob {
          animation: blob 10s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 10px;
          border: 2px solid transparent;
          background-clip: content-box;
        }
      `}</style>
    </div>
  );

  // Portal 逻辑保持不变
  let portalContainer = typeof document !== 'undefined' ? document.getElementById('start-screen-portal-root') : null;
  if (typeof document !== 'undefined' && !portalContainer) {
    portalContainer = document.createElement('div');
    portalContainer.id = 'start-screen-portal-root';
    document.body.appendChild(portalContainer);
  }

  if (portalContainer) {
    portalContainer.style.cssText = `
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      width: 100vw; height: 100vh;
      margin: 0; padding: 0;
      overflow: hidden;
      z-index: 999999;
      pointer-events: none;
    `.replace(/\s+/g, ' ').trim();
  }

  if (!portalContainer) return content;
  return createPortal(content, portalContainer);
};

StartScreen.displayName = 'StartScreen';
export default StartScreen;

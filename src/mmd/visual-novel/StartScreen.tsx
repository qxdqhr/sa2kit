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
      className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-xl z-[1000000] pointer-events-auto transition-all animate-in fade-in zoom-in-95 duration-300"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg mx-4 p-8 rounded-[2.5rem] border border-white/40 shadow-[0_20px_80px_rgba(0,0,0,0.4)] relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.15))',
          backdropFilter: 'blur(40px) saturate(200%)',
          WebkitBackdropFilter: 'blur(40px) saturate(200%)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 装饰性背景光晕 */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-cyan-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-pink-400/20 rounded-full blur-3xl pointer-events-none" />

        {/* 标题 */}
        <div className="flex items-center justify-between mb-8 relative">
          <div className="flex flex-col">
            <h2 className="text-2xl font-bold text-white tracking-wider drop-shadow-lg">{title}</h2>
            <div className="h-1.5 w-16 bg-white/60 rounded-full mt-2 shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
          </div>
          <button 
            onClick={onClose}
            className="w-12 h-12 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/30 text-white transition-all border border-white/20 shadow-inner"
          >
            ✕
          </button>
        </div>
        
        {/* 内容 */}
        <div className="text-white leading-relaxed max-h-[50vh] overflow-y-auto pr-4 custom-scrollbar relative font-medium">
          {children}
        </div>
        
        {/* 确定按钮 */}
        <div className="mt-10 flex justify-center relative">
          <button
            onClick={onClose}
            className="px-14 py-3.5 rounded-2xl bg-white/20 hover:bg-white/40 text-white font-bold transition-all border border-white/50 shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:scale-105 active:scale-95 tracking-[0.2em] uppercase text-sm"
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
        backgroundColor: '#050505',
        margin: 0,
        padding: 0,
      }}
    >
      {/* 动态明亮背景层 */}
      <div className="absolute inset-0 w-full h-full overflow-hidden">
        {/* 中心扩散光辉 */}
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150vw] h-[150vw] opacity-40 pointer-events-none"
          style={{
            background: 'radial-gradient(circle at center, rgba(57, 197, 187, 0.4) 0%, rgba(255, 182, 193, 0.2) 30%, transparent 70%)',
            filter: 'blur(60px)',
            animation: 'pulse 10s ease-in-out infinite'
          }}
        />
        
        {/* 漂浮的彩色星云 */}
        <div className="absolute inset-0 transition-opacity duration-1000">
          <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-cyan-500/10 rounded-full blur-[120px] animate-blob" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-purple-500/10 rounded-full blur-[120px] animate-blob animation-delay-2000" />
          <div className="absolute top-[20%] right-[10%] w-[40%] h-[40%] bg-pink-500/10 rounded-full blur-[100px] animate-blob animation-delay-4000" />
        </div>

        {/* 密集的微粒效果 */}
        <div className="absolute inset-0 opacity-60">
          {[...Array(40)].map((_, i) => (
            <div 
              key={i}
              className="absolute bg-white/40 rounded-full"
              style={{
                width: Math.random() * 3 + 1 + 'px',
                height: Math.random() * 3 + 1 + 'px',
                top: Math.random() * 100 + '%',
                left: Math.random() * 100 + '%',
                boxShadow: '0 0 10px rgba(255,255,255,0.5)',
                animation: `floatParticle ${Math.random() * 10 + 10}s linear infinite`,
                animationDelay: `-${Math.random() * 20}s`
              }}
            />
          ))}
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="relative z-10 w-full max-w-5xl mx-auto px-6 flex flex-col items-center">
        
        {/* 标题区域 - 彻底解决重叠与间距 */}
        <div className="text-center mb-20 md:mb-32 group flex flex-col items-center">
          {/* 上装饰线 */}
          <div className="w-40 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent mb-10 shadow-[0_0_15px_rgba(255,255,255,0.5)]" />
          
          <h1
            className="text-6xl md:text-8xl font-black text-white tracking-[0.15em] leading-tight select-none"
            style={{
              filter: 'drop-shadow(0 0 20px rgba(255,255,255,0.3))',
              textShadow: '0 10px 30px rgba(0,0,0,0.5)'
            }}
          >
            {scriptName || 'VISUAL NOVEL'}
          </h1>
          
          {/* 下装饰区 - 增加明显间距 */}
          <div className="mt-10 flex flex-col items-center gap-4">
            <div className="h-1 w-32 bg-white rounded-full opacity-80 shadow-[0_0_20px_rgba(255,255,255,0.8)]" />
            <span className="text-sm md:text-base tracking-[0.8em] text-white/60 font-medium uppercase translate-x-[0.4em]">
              Adventure System
            </span>
          </div>
        </div>

        {/* 交互按钮区 - 更加明亮精致 */}
        <div className="flex flex-col gap-10 items-center w-full max-w-sm">
          
          {/* 核心开始按钮 */}
          <button
            onClick={onStart}
            className="group relative w-full h-20 flex items-center justify-center transition-all duration-500 active:scale-95"
          >
            {/* 按钮底色 */}
            <div 
              className="absolute inset-0 bg-white/10 backdrop-blur-2xl border-2 border-white/40 rounded-3xl transition-all duration-500 group-hover:bg-white/25 group-hover:border-white/70 group-hover:shadow-[0_0_50px_rgba(255,255,255,0.3)] group-hover:-inset-1"
            />
            
            {/* 流光特效 */}
            <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-[25deg] -translate-x-[200%] group-hover:translate-x-[200%] transition-transform duration-1000 ease-in-out" />
            </div>
            
            <div className="relative flex items-center gap-6">
              <div className="w-3 h-3 rounded-full bg-cyan-400 animate-ping opacity-75" />
              <span className="text-2xl font-black text-white tracking-[0.4em] drop-shadow-md">{startText}</span>
              <div className="w-3 h-3 rounded-full bg-pink-400 animate-ping opacity-75" />
            </div>
          </button>

          {/* 功能按钮组 */}
          <div className="flex gap-8 w-full justify-center">
            {[
              { text: settingsText, onClick: () => setShowSettings(true), color: 'rgba(57, 197, 187, 0.2)' },
              { text: aboutText, onClick: () => setShowAbout(true), color: 'rgba(255, 182, 193, 0.2)' }
            ].map((btn, idx) => (
              <button
                key={idx}
                onClick={btn.onClick}
                className="group relative flex-1 h-14 flex items-center justify-center transition-all duration-300 active:scale-95 overflow-hidden rounded-2xl"
              >
                <div 
                  className="absolute inset-0 bg-white/5 backdrop-blur-xl border border-white/20 transition-all duration-300 group-hover:bg-white/15 group-hover:border-white/40"
                />
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" 
                  style={{ background: btn.color }}
                />
                <span className="relative text-sm md:text-base font-bold text-white/80 group-hover:text-white tracking-[0.25em] transition-colors uppercase">
                  {btn.text}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 固定到底部的版本信息 - 不再随内容重叠 */}
      <div className="fixed bottom-10 left-0 right-0 text-center pointer-events-none select-none">
        <div className="inline-block px-6 py-2 rounded-full bg-white/5 backdrop-blur-md border border-white/10">
          <span className="text-[10px] md:text-xs text-white/30 tracking-[0.5em] font-light uppercase">
            Ver 1.6.2 — ENGINE POWERED BY SA2KIT
          </span>
        </div>
      </div>

      {/* 弹窗内容 */}
      <VNModal title={settingsText} show={showSettings} onClose={() => setShowSettings(false)}>
        <div className="space-y-8 py-4">
          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm font-bold tracking-widest text-white/60">
              <span>MUSIC VOLUME</span>
              <span>80%</span>
            </div>
            <div className="h-3 bg-white/10 rounded-full p-0.5 border border-white/10">
              <div className="h-full w-[80%] bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full shadow-[0_0_15px_rgba(34,211,238,0.5)]" />
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm font-bold tracking-widest text-white/60">
              <span>TEXT SPEED</span>
              <span>NORMAL</span>
            </div>
            <div className="flex gap-3">
              {['SLOW', 'NORMAL', 'FAST'].map((s, i) => (
                <div key={s} className={`flex-1 py-3 rounded-xl border text-center text-xs font-bold transition-all cursor-pointer ${i===1 ? 'bg-white/20 border-white/60 text-white' : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10 hover:border-white/30'}`}>
                  {s}
                </div>
              ))}
            </div>
          </div>
          
          <div className="pt-4 flex items-center justify-between opacity-50 italic text-xs border-t border-white/10">
            <span>Auto Save Enabled</span>
            <span>Cloud Sync Active</span>
          </div>
        </div>
      </VNModal>

      <VNModal title={aboutText} show={showAbout} onClose={() => setShowAbout(false)}>
        <div className="space-y-8 py-4">
          <div className="flex items-center gap-6 p-6 rounded-3xl bg-white/5 border border-white/10">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 flex items-center justify-center text-3xl font-black text-white shadow-[0_10px_30px_rgba(0,0,0,0.3)]">
              S2
            </div>
            <div>
              <h3 className="text-2xl font-black text-white tracking-tight">{scriptName || 'Project SA2'}</h3>
              <p className="text-xs font-bold text-white/40 tracking-widest mt-1 uppercase">Visual Novel Experience</p>
            </div>
          </div>
          
          <div className="space-y-4 px-2">
            <p className="text-white/80 font-medium leading-relaxed">
              采用 sa2kit 引擎构建的新一代实时 3D 视觉小说。结合了 MMD 实时渲染技术与交互式剧情分支系统，致力于打造极致的沉浸式叙事体验。
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/10">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-white/30 tracking-widest">DEVELOPER</span>
              <span className="text-xs font-bold text-white/80">SA2KIT TEAM</span>
            </div>
            <div className="flex flex-col gap-1 text-right">
              <span className="text-[10px] font-bold text-white/30 tracking-widest">ENGINE</span>
              <span className="text-xs font-bold text-white/80">THREE.JS / REACT</span>
            </div>
          </div>
        </div>
      </VNModal>

      {/* 注入所需的关键帧动画 */}
      <style jsx>{`
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

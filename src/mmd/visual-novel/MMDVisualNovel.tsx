import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { MMDPlayerBase } from '../components/MMDPlayerBase';
import { MMDPlayerBaseRef } from '../types';
import { DialogueBox } from './DialogueBox';
import { HistoryPanel } from './HistoryPanel';
import { LoadingOverlay } from './LoadingOverlay';
import {
  MMDVisualNovelProps,
  MMDVisualNovelRef,
  VisualNovelNode,
  DialogueLine,
  DialogueHistoryItem,
} from './types';

/**
 * MMDVisualNovel - Galgame 风格视觉小说组件
 * 
 * 核心功能：
 * - 将 MMDPlaylist 封装为 Galgame 风格
 * - 每个节点包含：模型、动作、对话数组
 * - 用户阅读完对话后自动切换节点
 * - 打字机效果显示文本
 * - 支持自动播放、快进、历史记录
 */
export const MMDVisualNovel = forwardRef<MMDVisualNovelRef, MMDVisualNovelProps>(
  (
    {
      script,
      stage,
      mobileOptimization,
      dialogueTheme,
      autoStart = false,
      initialNodeIndex = 0,
      initialDialogueIndex = 0,
      onNodeChange,
      onDialogueChange,
      onScriptComplete,
      onError,
      showDebugInfo = false,
      showSkipButton = true,
      showAutoButton = true,
      showHistoryButton = true,
      className,
      style,
    },
    ref
  ) => {
    const { nodes, loop = false } = script;

    // 状态管理
    const [currentNodeIndex, setCurrentNodeIndex] = useState(initialNodeIndex);
    const [currentDialogueIndex, setCurrentDialogueIndex] = useState(initialDialogueIndex);
    const [isLoading, setIsLoading] = useState(true);
    const [isAnimationPlaying, setIsAnimationPlaying] = useState(false); // 新增：追踪动画是否已开始播放
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [isAutoMode, setIsAutoMode] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [history, setHistory] = useState<DialogueHistoryItem[]>([]);
    const [isStarted, setIsStarted] = useState(autoStart);

    // Refs
    const playerRef = useRef<MMDPlayerBaseRef>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const autoTimerRef = useRef<NodeJS.Timeout | null>(null);
    const typingCompleteRef = useRef(false);
    const isStartedRef = useRef(autoStart); // 用 ref 跟踪 isStarted 的当前值

    // 获取当前节点和对话
    const currentNode = nodes[currentNodeIndex];
    const currentDialogue = currentNode?.dialogues[currentDialogueIndex] || null;

    // 添加对话到历史记录
    const addToHistory = useCallback((dialogue: DialogueLine, nodeIndex: number, dialogueIndex: number) => {
      setHistory((prev) => [
        ...prev,
        {
          nodeIndex,
          dialogueIndex,
          speaker: dialogue.speaker,
          text: dialogue.text,
          timestamp: Date.now(),
        },
      ]);
    }, []);

    // 切换到下一条对话
    const goToNextDialogue = useCallback(() => {
      if (!currentNode) return;

      // 清除自动播放定时器
      if (autoTimerRef.current) {
        clearTimeout(autoTimerRef.current);
        autoTimerRef.current = null;
      }

      const nextDialogueIndex = currentDialogueIndex + 1;

      if (nextDialogueIndex < currentNode.dialogues.length && currentNode?.dialogues[nextDialogueIndex] !== undefined) {
        // 还有更多对话
        const nextDialogue = currentNode.dialogues[nextDialogueIndex];
        setCurrentDialogueIndex(nextDialogueIndex);
        addToHistory(nextDialogue, currentNodeIndex, nextDialogueIndex);
        onDialogueChange?.(nextDialogue, nextDialogueIndex, currentNodeIndex);
        typingCompleteRef.current = false;
      } else {
        // 当前节点对话结束，切换到下一个节点
        const nextNodeIndex = currentNodeIndex + 1;

        if (nextNodeIndex < nodes.length) {
          // 还有更多节点
          goToNode(nextNodeIndex);
        } else if (loop) {
          // 循环播放
          goToNode(0);
        } else {
          // 剧本结束
          onScriptComplete?.();
        }
      }
    }, [currentNode, currentDialogueIndex, currentNodeIndex, nodes.length, loop, addToHistory, onDialogueChange, onScriptComplete]);

    // 切换到指定节点
    const goToNode = useCallback(
      (nodeIndex: number) => {
        if (nodeIndex < 0 || nodeIndex >= nodes.length) return;
        if (isTransitioning) return;

        const node = nodes[nodeIndex];
        if (!node) return;

        console.log(`[MMDVisualNovel] Transitioning to node ${nodeIndex}`);

        // 🔧 立即设置加载状态，确保遮罩覆盖整个切换过程
        setIsTransitioning(true);
        setIsLoading(true);
        setIsAnimationPlaying(false); // 重置动画播放状态

        // 给物理引擎清理时间后再更新节点
        setTimeout(() => {
          // 更新节点
          setCurrentNodeIndex(nodeIndex);
          setCurrentDialogueIndex(0);
          typingCompleteRef.current = false;

          // 添加第一条对话到历史
          if (node.dialogues.length > 0 && node?.dialogues[0] !== undefined) {
            addToHistory(node.dialogues[0], nodeIndex, 0);
          }

          onNodeChange?.(node, nodeIndex);
          if (node.dialogues.length > 0 && node?.dialogues[0] !== undefined) {
            onDialogueChange?.(node.dialogues[0], 0, nodeIndex);
          }

          // 🔧 结束过渡状态，但保持加载状态直到新模型完全加载
          // 注意：isLoading 和 isAnimationPlaying 会在 MMDPlayerBase 的回调中更新
          setTimeout(() => {
            setIsTransitioning(false);
            console.log(`[MMDVisualNovel] Transition to node ${nodeIndex} completed, waiting for model load`);
          }, 100);
        }, 300);
      },
      [nodes, isTransitioning, addToHistory, onNodeChange, onDialogueChange]
    );

    // 跳转到指定对话
    const goToDialogue = useCallback(
      (dialogueIndex: number) => {
        if (!currentNode) return;
        const dialogue = currentNode.dialogues[dialogueIndex];

        if (dialogueIndex < 0 || dialogueIndex >= currentNode.dialogues.length || dialogue === undefined) return;
        setCurrentDialogueIndex(dialogueIndex);
        addToHistory(dialogue, currentNodeIndex, dialogueIndex);
        onDialogueChange?.(dialogue, dialogueIndex, currentNodeIndex);
        typingCompleteRef.current = false;
      },
      [currentNode, currentNodeIndex, addToHistory, onDialogueChange]
    );

    // 处理点击对话框
    const handleDialogueClick = useCallback(() => {
      if (!typingCompleteRef.current) {
        // 还在打字中，跳过打字动画
        typingCompleteRef.current = true;
        return;
      }

      // 打字完成，切换到下一条对话
      goToNextDialogue();
    }, [goToNextDialogue]);

    // 处理打字完成
    const handleTypingComplete = useCallback(() => {
      typingCompleteRef.current = true;
      setIsTyping(false);

      // 如果是自动模式或不需要等待点击
      if (isAutoMode || currentDialogue?.waitForClick === false) {
        const delay = currentDialogue?.autoDelay ?? 2000;
        autoTimerRef.current = setTimeout(() => {
          goToNextDialogue();
        }, delay);
      }
    }, [isAutoMode, currentDialogue, goToNextDialogue]);

    // 监听打字状态
    useEffect(() => {
      if (currentDialogue) {
        setIsTyping(true);
        typingCompleteRef.current = false;

        // 计算打字完成时间
        const text = currentDialogue.text;
        const speed = currentDialogue.typeSpeed ?? 50;
        const typingDuration = text.length * speed;

        const timer = setTimeout(() => {
          handleTypingComplete();
        }, typingDuration);

        return () => clearTimeout(timer);
      }
    }, [currentDialogue, handleTypingComplete]);

    // 切换自动模式
    const toggleAutoMode = useCallback(() => {
      setIsAutoMode((prev) => !prev);
    }, []);

    // 快进 - 跳到下一个节点
    const handleSkip = useCallback(() => {
      const nextNodeIndex = currentNodeIndex + 1;
      if (nextNodeIndex < nodes.length) {
        goToNode(nextNodeIndex);
      } else if (loop) {
        goToNode(0);
      } else {
        onScriptComplete?.();
      }
    }, [currentNodeIndex, nodes.length, loop, goToNode, onScriptComplete]);

    // 开始游戏
    const handleStart = useCallback(() => {
      setIsStarted(true);
      isStartedRef.current = true; // 同步更新 ref
      if (currentNode && currentNode.dialogues.length > 0 && currentNode?.dialogues[0] !== undefined) {
        addToHistory(currentNode?.dialogues[0], currentNodeIndex, 0);
      }
      // 启动动画播放
      setTimeout(() => {
        playerRef.current?.play();
      }, 100);
    }, [currentNode, currentNodeIndex, addToHistory]);

    // 暴露给父组件的方法
    useImperativeHandle(
      ref,
      () => ({
        goToNode,
        goToDialogue,
        getCurrentNodeIndex: () => currentNodeIndex,
        getCurrentDialogueIndex: () => currentDialogueIndex,
        getHistory: () => history,
        setAutoMode: setIsAutoMode,
        skipTyping: () => {
          typingCompleteRef.current = true;
        },
      }),
      [goToNode, goToDialogue, currentNodeIndex, currentDialogueIndex, history]
    );

    // 自动开始时添加第一条对话到历史
    useEffect(() => {
      if (autoStart && currentNode && currentNode.dialogues.length > 0 && history.length === 0 && currentNode?.dialogues[0] !== undefined) {
        addToHistory(currentNode?.dialogues[0], currentNodeIndex, 0);
      }
    }, [autoStart, currentNode, currentNodeIndex, history.length, addToHistory]);

    // 清理定时器
    useEffect(() => {
      return () => {
        if (autoTimerRef.current) {
          clearTimeout(autoTimerRef.current);
        }
      };
    }, []);

    // 空剧本检查
    if (!currentNode) {
      return (
        <div className="flex h-full w-full items-center justify-center bg-black text-white">
          剧本为空
        </div>
      );
    }

    return (
      <div
        ref={containerRef}
        className={`relative bg-black ${className}`}
        style={{ width: '100%', height: '100%', overflow: 'hidden', ...style }}
      >
        {/* MMD 播放器层 - 覆盖整个屏幕，明确在最底层 */}
        <div 
          className="absolute inset-0 w-full h-full"
          style={{ 
            zIndex: 0,
            // 在加载期间隐藏，避免看到模型加载过程
            opacity: (isLoading || isTransitioning || !isAnimationPlaying) ? 0 : 1,
            transition: 'opacity 0.3s ease-in-out'
          }}
        >
          {!isTransitioning && (
            <MMDPlayerBase
              key={currentNode.id}
              ref={playerRef}
              resources={currentNode.resources}
              stage={stage}
              autoPlay={isStarted}
              loop={currentNode.loopAnimation === true}
              mobileOptimization={mobileOptimization}
              onLoad={() => {
                console.log('[MMDVisualNovel] MMDPlayerBase onLoad called');
                setIsLoading(false);
                // 如果已经开始游戏，启动动画播放（使用 ref 获取最新值）
                if (isStartedRef.current) {
                  console.log('[MMDVisualNovel] Game already started, triggering play');
                  setTimeout(() => {
                    playerRef.current?.play();
                  }, 100);
                }
              }}
              onPlay={() => {
                // 动画开始播放时才设置为 true
                console.log('[MMDVisualNovel] MMDPlayerBase onPlay called');
                setIsAnimationPlaying(true);
              }}
              onError={onError}
            />
          )}
        </div>

        {/* 加载遮罩和开始界面 */}
        <LoadingOverlay
          isLoading={(() => {
            const shouldShowLoading = (isLoading || isTransitioning || !isAnimationPlaying) && isStarted;
            console.log('[MMDVisualNovel] LoadingOverlay conditions:', {
              isLoading,
              isTransitioning,
              isAnimationPlaying,
              isStarted,
              shouldShowLoading
            });
            return shouldShowLoading;
          })()}
          showStartScreen={!isStarted}
          scriptName={script.name}
          loadingText="正在准备场景中..."
          startText="点击开始"
          onStart={handleStart}
        />

        {/* 对话框 - 仅在动画开始播放后显示 */}
        {(() => {
          const shouldShow = isStarted && isAnimationPlaying && currentDialogue && !showHistory;
          console.log('[MMDVisualNovel] DialogueBox render condition:', {
            isStarted,
            isAnimationPlaying,
            hasDialogue: !!currentDialogue,
            showHistory,
            shouldShow,
            dialogue: currentDialogue
          });
          
          return shouldShow ? (
            <DialogueBox
              dialogue={currentDialogue}
              theme={dialogueTheme}
              isTyping={isTyping}
              isAutoMode={isAutoMode}
              onClick={handleDialogueClick}
              onSkipTyping={() => {
                typingCompleteRef.current = true;
              }}
              onToggleAuto={toggleAutoMode}
              onOpenHistory={() => setShowHistory(true)}
              onSkip={handleSkip}
              showControls={true}
              showSkipButton={showSkipButton}
              showAutoButton={showAutoButton}
              showHistoryButton={showHistoryButton}
            />
          ) : null;
        })()}

        {/* 历史记录面板 */}
        {showHistory && (
          <HistoryPanel
            history={history}
            theme={dialogueTheme}
            onClose={() => setShowHistory(false)}
          />
        )}

     
      </div>
    );
  }
);

MMDVisualNovel.displayName = 'MMDVisualNovel';

export default MMDVisualNovel;


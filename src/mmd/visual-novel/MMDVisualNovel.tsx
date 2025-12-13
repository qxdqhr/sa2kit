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
      autoStart = true,
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

      if (nextDialogueIndex < currentNode.dialogues.length) {
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

        // 开始过渡
        setIsTransitioning(true);

        // 给物理引擎清理时间
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setTimeout(() => {
              // 更新节点
              setCurrentNodeIndex(nodeIndex);
              setCurrentDialogueIndex(0);
              setIsLoading(true);
              typingCompleteRef.current = false;

              // 添加第一条对话到历史
              if (node.dialogues.length > 0) {
                addToHistory(node.dialogues[0], nodeIndex, 0);
              }

              onNodeChange?.(node, nodeIndex);
              if (node.dialogues.length > 0) {
                onDialogueChange?.(node.dialogues[0], 0, nodeIndex);
              }

              // 结束过渡
              requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                  setTimeout(() => {
                    setIsTransitioning(false);
                    console.log(`[MMDVisualNovel] Transition to node ${nodeIndex} completed`);
                  }, 100);
                });
              });
            }, 300);
          });
        });
      },
      [nodes, isTransitioning, addToHistory, onNodeChange, onDialogueChange]
    );

    // 跳转到指定对话
    const goToDialogue = useCallback(
      (dialogueIndex: number) => {
        if (!currentNode) return;
        if (dialogueIndex < 0 || dialogueIndex >= currentNode.dialogues.length) return;

        setCurrentDialogueIndex(dialogueIndex);
        const dialogue = currentNode.dialogues[dialogueIndex];
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
      if (currentNode && currentNode.dialogues.length > 0) {
        addToHistory(currentNode.dialogues[0], currentNodeIndex, 0);
      }
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
      if (autoStart && currentNode && currentNode.dialogues.length > 0 && history.length === 0) {
        addToHistory(currentNode.dialogues[0], currentNodeIndex, 0);
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
        {!isTransitioning && (
          <div 
            className="absolute inset-0 w-full h-full"
            style={{ zIndex: 0 }}
          >
            <MMDPlayerBase
              key={currentNode.id}
              ref={playerRef}
              resources={currentNode.resources}
              stage={stage}
              autoPlay={isStarted}
              loop={currentNode.loopAnimation !== false}
              mobileOptimization={mobileOptimization}
              onLoad={() => {
                setIsLoading(false);
                playerRef.current?.play();
              }}
              onError={onError}
            />
          </div>
        )}

        {/* 加载/过渡遮罩 */}
        {(isLoading || isTransitioning) && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/20 border-t-blue-500" />
              <div className="text-sm text-white/80">
                {isTransitioning ? '场景切换中...' : '正在加载...'}
              </div>
            </div>
          </div>
        )}

        {/* 开始界面 */}
        {!isStarted && !isLoading && (
          <div
            className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-sm cursor-pointer"
            onClick={handleStart}
          >
            <div className="text-center">
              <h1 className="text-3xl font-bold text-white mb-4">{script.name}</h1>
              <p className="text-white/70 text-lg animate-pulse">点击开始</p>
            </div>
          </div>
        )}

        {/* 对话框 */}
        {(() => {
          const shouldShow = isStarted && currentDialogue && !showHistory;
          console.log('[MMDVisualNovel] DialogueBox render condition:', {
            isStarted,
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


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
import { SkipConfirmDialog } from './SkipConfirmDialog';
import { ChoiceMenu } from './ChoiceMenu';
import {
  MMDVisualNovelProps,
  MMDVisualNovelRef,
  VisualNovelNode,
  DialogueLine,
  DialogueHistoryItem,
  VisualEffect,
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
    const [isVmdFinished, setIsVmdFinished] = useState(false);
    const [pendingNodeIndex, setPendingNodeIndex] = useState<number | null>(null);
    const [showChoices, setShowChoices] = useState(false);
    const [isCameraManual, setIsCameraManual] = useState(false);
    const [variables, setVariables] = useState<Record<string, string | number | boolean>>({});
    const [activeEffect, setActiveEffect] = useState<VisualEffect | null>(null);

    // Refs
    const playerRef = useRef<MMDPlayerBaseRef>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const autoTimerRef = useRef<NodeJS.Timeout | null>(null);
    const typingCompleteRef = useRef(false);
    const isStartedRef = useRef(autoStart); // 用 ref 跟踪 isStarted 的当前值
    const lastAnimationTimeRef = useRef(0);
    const isVmdFinishedRef = useRef(false);
    const effectTimerRef = useRef<NodeJS.Timeout | null>(null);

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

    // 触发特效
    const triggerEffect = useCallback((effect?: VisualEffect) => {
      if (!effect) return;
      
      // 清除旧的特效定时器
      if (effectTimerRef.current) {
        clearTimeout(effectTimerRef.current);
      }

      setActiveEffect(effect);
      
      // 自动清理
      effectTimerRef.current = setTimeout(() => {
        setActiveEffect(null);
        effectTimerRef.current = null;
      }, effect.duration || 1000);
    }, []);

    // 跳转到指定节点
    const goToNode = useCallback(
      (nodeIndex: number, force: boolean = false) => {
        if (nodeIndex < 0 || nodeIndex >= nodes.length) return;
        if (isTransitioning) return;

        const node = nodes[nodeIndex];
        if (!node) return;

        // 如果当前节点有 VMD 动画且未播放完成，且不是强制跳转，则弹出确认框
        const currentResources = nodes[currentNodeIndex]?.resources;
        if (!force && currentResources?.motionPath && !isVmdFinishedRef.current) {
          console.log('[MMDVisualNovel] VMD not finished, showing confirmation');
          setPendingNodeIndex(nodeIndex);
          return;
        }

        console.log(`[MMDVisualNovel] Transitioning to node ${nodeIndex}`);

        // 🔧 立即设置加载状态，确保遮罩覆盖整个切换过程
        setIsTransitioning(true);
        setIsLoading(true);
        setIsAnimationPlaying(false); // 重置动画播放状态
        setIsVmdFinished(false); // 重置 VMD 完成状态
        isVmdFinishedRef.current = false; // 同步重置 ref
        setPendingNodeIndex(null); // 清除挂起的跳转
        setShowChoices(false); // 隐藏选项菜单
        lastAnimationTimeRef.current = 0; // 重置动画时间记录

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
      [nodes, isTransitioning, addToHistory, onNodeChange, onDialogueChange, currentNodeIndex]
    );

    // 判定并跳转到下一个节点
    const triggerNodeTransition = useCallback(() => {
      if (!currentNode) return;
      
      let nextNodeIndex = currentNodeIndex + 1;

      // 如果存在分支判定逻辑
      if (currentNode.nextCondition) {
        const { key, map, defaultIndex } = currentNode.nextCondition;
        const val = variables[key];
        if (val !== undefined && map[val as string | number] !== undefined) {
          nextNodeIndex = map[val as string | number]!;
          console.log(`[MMDVisualNovel] Branching: ${key}=${val} -> node ${nextNodeIndex}`);
        } else {
          nextNodeIndex = defaultIndex;
        }
      }

      if (nextNodeIndex < nodes.length && nextNodeIndex >= 0) {
        goToNode(nextNodeIndex);
      } else if (loop) {
        goToNode(0);
      } else {
        // 剧本结束
        onScriptComplete?.();
      }
    }, [currentNode, currentNodeIndex, nodes.length, loop, variables, goToNode, onScriptComplete]);

    // 切换到下一条对话
    const goToNextDialogue = useCallback(() => {
      if (!currentNode) return;

      // 如果当前对话行自带分支，且还未显示分支，则先显示分支
      if (currentDialogue?.choices && currentDialogue.choices.length > 0 && !showChoices) {
        setShowChoices(true);
        return;
      }

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
      } else if (currentNode.choices && currentNode.choices.length > 0) {
        // 当前节点末尾有分支选项（兼容旧版）
        setShowChoices(true);
      } else {
        // 无分支，自动切换到下一个节点
        triggerNodeTransition();
      }
    }, [currentNode, currentDialogue, currentDialogueIndex, currentNodeIndex, nodes.length, loop, addToHistory, onDialogueChange, onScriptComplete, showChoices, variables, goToNode, triggerNodeTransition]);

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
      // 如果没有对话，返回空的清理函数
      return undefined;
    }, [currentDialogue, handleTypingComplete]);

    useEffect(() => {
    if (currentDialogue?.effect) {
      triggerEffect(currentDialogue.effect);
    }
  }, [currentNodeIndex, currentDialogueIndex, triggerEffect]);

  // 切换自动模式
    const toggleAutoMode = useCallback(() => {
      setIsAutoMode((prev) => !prev);
    }, []);

    // 快进 - 跳到下一个节点
    const handleSkip = useCallback(() => {
      if (currentNode?.choices && currentNode.choices.length > 0) {
        setShowChoices(true);
        return;
      }
      
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
        getVariables: () => variables,
        setVariable: (key: string, value: string | number | boolean) => {
          setVariables(prev => ({ ...prev, [key]: value }));
        },
        setAutoMode: setIsAutoMode,
        skipTyping: () => {
          typingCompleteRef.current = true;
        },
        triggerEffect,
      }),
      [goToNode, goToDialogue, currentNodeIndex, currentDialogueIndex, history, triggerEffect]
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
        if (effectTimerRef.current) {
          clearTimeout(effectTimerRef.current);
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
              stage={{ ...stage, ...currentNode.stage }}
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
              onTimeUpdate={(time) => {
                const duration = playerRef.current?.getDuration() || 0;
                
                // 判定动画完成的条件：
                // 1. 播放进度超过 98%
                // 2. 或者检测到时间回跳（循环发生）
                const isNearEnd = duration > 0 && time > duration * 0.98;
                const isLooped = time < lastAnimationTimeRef.current && lastAnimationTimeRef.current > 0;

                if (isNearEnd || isLooped) {
                  if (!isVmdFinishedRef.current) {
                    console.log('[MMDVisualNovel] VMD finished/looped, marking as finished');
                    isVmdFinishedRef.current = true;
                    setIsVmdFinished(true);
                  }
                }
                lastAnimationTimeRef.current = time;
              }}
              onEnded={() => {
                console.log('[MMDVisualNovel] VMD ended, marking as finished');
                isVmdFinishedRef.current = true;
                setIsVmdFinished(true);
              }}
              onCameraChange={(isManual) => {
                setIsCameraManual(isManual);
              }}
              onError={onError}
            />
          )}
        </div>

        {/* 特效渲染层 */}
        {activeEffect && (
          <div 
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
            style={{ zIndex: 999 }}
          >
            {activeEffect.type === 'flash' && (
              <div 
                className="h-full w-full"
                style={{ 
                  backgroundColor: activeEffect.color || 'white',
                  animation: `flash-anim ${activeEffect.duration || 500}ms ease-out forwards`
                }} 
              />
            )}

            {activeEffect.type === 'gif' && activeEffect.url && (
              <img 
                src={activeEffect.url} 
                alt="effect"
                className={activeEffect.position === 'full' ? 'h-full w-full object-cover' : 'max-h-full max-w-full'}
              />
            )}
            
            <style>{`
              @keyframes flash-anim {
                0% { opacity: 0; }
                25% { opacity: 1; }
                100% { opacity: 0; }
              }
            `}</style>
          </div>
        )}

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
          const shouldShow = isStarted && isAnimationPlaying && currentDialogue && !showHistory && !showChoices;
          console.log('[MMDVisualNovel] DialogueBox render condition:', {
            isStarted,
            isAnimationPlaying,
            hasDialogue: !!currentDialogue,
            showHistory,
            showChoices,
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
              onResetCamera={() => {
                playerRef.current?.resetCamera();
                setIsCameraManual(false);
              }}
              isCameraManual={isCameraManual}
              showControls={true}
              showSkipButton={showSkipButton}
              showAutoButton={showAutoButton}
              showHistoryButton={showHistoryButton}
            />
          ) : null;
        })()}

        {/* 确认跳过动画弹窗 */}
        {pendingNodeIndex !== null && (
          <SkipConfirmDialog
            onConfirm={() => {
              if (pendingNodeIndex !== null) {
                goToNode(pendingNodeIndex, true);
              }
            }}
            onCancel={() => {
              setPendingNodeIndex(null);
            }}
          />
        )}

        {/* 分支选项菜单 */}
        {showChoices && (currentDialogue?.choices || currentNode.choices) && (
          <ChoiceMenu
            choices={(currentDialogue?.choices || currentNode.choices)!}
            theme={dialogueTheme}
            onSelect={(choice) => {
              // 1. 处理变量设置
              if (choice.setVariable) {
                const { key, value } = choice.setVariable;
                setVariables(prev => ({ ...prev, [key]: value }));
                console.log(`[MMDVisualNovel] Variable set: ${key} = ${value}`);
              }

            // 2. 执行回调
            choice.onSelect?.();

            // 3. 触发特效
            if (choice.effect) {
              triggerEffect(choice.effect);
            }

            // 4. 处理跳转逻辑
            setShowChoices(false);

              if (choice.nextNodeIndex !== undefined) {
                if (choice.nextNodeIndex === currentNodeIndex) {
                  // 跳转到当前节点的特定对话
                  goToDialogue(choice.nextDialogueIndex || 0);
                } else {
                  // 跳转到其他节点
                  goToNode(choice.nextNodeIndex, true);
                }
              } else if (currentDialogue?.choices) {
                // 没有指定跳转目标且是在对话行中触发的，逻辑上应该进入下一行
                const nextIdx = currentDialogueIndex + 1;
                if (currentNode && nextIdx < currentNode.dialogues.length) {
                  const nextDialogue = currentNode.dialogues[nextIdx];
                  if (nextDialogue) {
                    setCurrentDialogueIndex(nextIdx);
                    addToHistory(nextDialogue, currentNodeIndex, nextIdx);
                    onDialogueChange?.(nextDialogue, nextIdx, currentNodeIndex);
                    typingCompleteRef.current = false;
                  }
                } else {
                  // 如果是最后一行了，执行正常的节点切换逻辑
                  triggerNodeTransition();
                }
              }
            }}
          />
        )}

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


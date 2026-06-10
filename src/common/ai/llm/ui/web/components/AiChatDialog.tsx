'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '../../../../../components/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../../../components/Dialog';
import { cn } from '../../../../../utils/cn';
import { useAiChat } from '../../../hooks/useAiChat';
import type { AiChatDialogProps } from '../../types';

type WebAiChatDialogProps = AiChatDialogProps & {
  className?: string;
  contentClassName?: string;
};

export const AiChatDialog: React.FC<WebAiChatDialogProps> = ({
  open,
  onOpenChange,
  client,
  title = 'AI 对话',
  placeholder = '输入你想咨询的问题...',
  systemPrompt,
  template,
  templateVariables,
  initialMessages,
  requestOptions,
  onResponse,
  onError,
  className,
  contentClassName,
}) => {
  const { messages, sendMessage, isLoading, error } = useAiChat({
    client,
    systemPrompt,
    template,
    initialMessages,
  });
  const [input, setInput] = useState('');
  const listRef = useRef<HTMLDivElement>(null);

  const hasMessages = messages.length > 0;
  const helperText = useMemo(() => {
    return template ? '模板已启用，支持 {{input}} 变量。' : '直接输入即可开始对话。';
  }, [template]);

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, open, isLoading]);

  const handleSend = async () => {
    const content = input.trim();
    if (!content || isLoading) return;
    setInput('');
    try {
      const response = await sendMessage(content, {
        ...requestOptions,
        template,
        variables: templateVariables,
      });
      onResponse?.(response);
    } catch (err) {
      const nextError = err instanceof Error ? err : new Error(String(err));
      onError?.(nextError);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'max-w-3xl border border-slate-200 bg-white p-0',
          contentClassName
        )}
      >
        <div className={cn('flex flex-col', className)}>
          <DialogHeader className="border-b border-slate-100 px-6 py-4">
            <DialogTitle className="text-base font-semibold text-slate-900">{title}</DialogTitle>
          </DialogHeader>

          <div className="flex flex-1 flex-col gap-4 px-6 py-4">
            <div
              ref={listRef}
              className="max-h-[60vh] min-h-[240px] overflow-y-auto rounded-xl border border-slate-100 bg-slate-50/60 p-4"
            >
              {!hasMessages && (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-sm text-slate-400">
                  <span>暂无对话内容</span>
                  <span>输入消息开始体验 AI 对话。</span>
                </div>
              )}
              <div className="flex flex-col gap-3">
                {messages.map((message, index) => {
                  const isUser = message.role === 'user';
                  return (
                    <div
                      key={`${message.role}-${index}`}
                      className={cn(
                        'max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm leading-relaxed',
                        isUser
                          ? 'ml-auto bg-slate-900 text-white'
                          : 'mr-auto border border-slate-200 bg-white text-slate-800'
                      )}
                    >
                      {message.content}
                    </div>
                  );
                })}
                {isLoading && (
                  <div className="mr-auto max-w-[70%] rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-500">
                    AI 正在思考...
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className="min-h-[96px] w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
              />
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs text-slate-400">{helperText}</span>
                <Button onClick={handleSend} disabled={!input.trim() || isLoading}>
                  {isLoading ? '发送中...' : '发送'}
                </Button>
              </div>
              {error && (
                <div className="mt-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-600">
                  {error.message || '对话出错，请重试。'}
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

import React, { useEffect, useMemo, useState } from 'react';
import { Button, ScrollView, Text, Textarea, View } from '@tarojs/components';
import { useAiChat } from '../../../hooks/useAiChat';
import type { AiChatDialogProps } from '../../types';

export const AiChatDialog: React.FC<AiChatDialogProps> = ({
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
}) => {
  const { messages, sendMessage, isLoading, error } = useAiChat({
    client,
    systemPrompt,
    template,
    initialMessages,
  });
  const [input, setInput] = useState('');

  const helperText = useMemo(() => {
    return template ? '模板已启用，支持 {{input}} 变量。' : '直接输入即可开始对话。';
  }, [template]);

  useEffect(() => {
    if (!open) {
      setInput('');
    }
  }, [open]);

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

  if (!open) {
    return null;
  }

  return (
    <View className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <View className="w-full max-w-[640px] rounded-2xl bg-white p-4 shadow-lg">
        <View className="flex items-center justify-between">
          <Text className="text-base font-semibold text-slate-900">{title}</Text>
          <Text
            className="text-xs text-slate-500"
            onClick={() => onOpenChange?.(false)}
          >
            关闭
          </Text>
        </View>

        <ScrollView
          scrollY
          className="mt-3 max-h-[60vh] rounded-xl border border-slate-100 bg-slate-50/60 p-3"
        >
          {messages.length === 0 && (
            <View className="flex flex-col items-center justify-center py-8 text-xs text-slate-400">
              <Text>暂无对话内容</Text>
              <Text>输入消息开始体验 AI 对话。</Text>
            </View>
          )}
          <View className="flex flex-col gap-3">
            {messages.map((message, index) => {
              const isUser = message.role === 'user';
              return (
                <View
                  key={`${message.role}-${index}`}
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                    isUser
                      ? 'ml-auto bg-slate-900 text-white'
                      : 'mr-auto border border-slate-200 bg-white text-slate-800'
                  }`}
                >
                  <Text>{message.content}</Text>
                </View>
              );
            })}
            {isLoading && (
              <View className="mr-auto max-w-[70%] rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500">
                <Text>AI 正在思考...</Text>
              </View>
            )}
          </View>
        </ScrollView>

        <View className="mt-3 rounded-xl border border-slate-100 bg-white p-3">
          <Textarea
            value={input}
            onInput={(event: { detail: { value: string } }) => setInput(event.detail.value)}
            placeholder={placeholder}
            className="min-h-[88px] w-full rounded-lg border border-slate-200 px-3 py-2 text-xs"
          />
          <View className="mt-2 flex items-center justify-between">
            <Text className="text-[10px] text-slate-400">{helperText}</Text>
            <Button
              size="mini"
              className="bg-slate-900 text-white"
              disabled={!input.trim() || isLoading}
              onClick={handleSend}
            >
              {isLoading ? '发送中...' : '发送'}
            </Button>
          </View>
          {error && (
            <View className="mt-2 rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-[10px] text-rose-600">
              <Text>{error.message || '对话出错，请重试。'}</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

import React, { useEffect, useMemo, useState } from 'react';
import { useAiChat } from '../../../hooks/useAiChat';
import type { AiChatDialogProps } from '../../types';

// @ts-ignore - react-native will be provided at runtime in RN environment
const ReactNative = require('react-native') as any;
const {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} = ReactNative;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    padding: 16,
  },
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  closeText: {
    fontSize: 12,
    color: '#64748b',
  },
  list: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  placeholder: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  placeholderText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  bubbleUser: {
    alignSelf: 'flex-end',
    backgroundColor: '#0f172a',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
  },
  bubbleAssistant: {
    alignSelf: 'flex-start',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
  },
  bubbleTextUser: {
    color: '#ffffff',
    fontSize: 12,
  },
  bubbleText: {
    color: '#1f2937',
    fontSize: 12,
  },
  loadingText: {
    color: '#64748b',
    fontSize: 12,
  },
  inputContainer: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  textInput: {
    minHeight: 96,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 10,
    textAlignVertical: 'top',
    fontSize: 12,
    color: '#0f172a',
  },
  helperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  helperText: {
    flex: 1,
    fontSize: 10,
    color: '#94a3b8',
    paddingRight: 8,
  },
  sendButton: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  sendButtonDisabled: {
    backgroundColor: '#94a3b8',
  },
  sendButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  error: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#fecdd3',
    backgroundColor: '#fff1f2',
    padding: 8,
    borderRadius: 8,
  },
  errorText: {
    color: '#e11d48',
    fontSize: 10,
  },
});

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

  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={() => onOpenChange?.(false)}
    >
      <SafeAreaView style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.container}
        >
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <Pressable onPress={() => onOpenChange?.(false)}>
              <Text style={styles.closeText}>关闭</Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.list}>
            {messages.length === 0 && (
              <View style={styles.placeholder}>
                <Text style={styles.placeholderText}>暂无对话内容</Text>
                <Text style={styles.placeholderText}>输入消息开始体验 AI 对话。</Text>
              </View>
            )}
            {messages.map((message, index) => {
              const isUser = message.role === 'user';
              return (
                <View
                  key={`${message.role}-${index}`}
                  style={isUser ? styles.bubbleUser : styles.bubbleAssistant}
                >
                  <Text style={isUser ? styles.bubbleTextUser : styles.bubbleText}>
                    {message.content}
                  </Text>
                </View>
              );
            })}
            {isLoading && (
              <View style={styles.bubbleAssistant}>
                <Text style={styles.loadingText}>AI 正在思考...</Text>
              </View>
            )}
          </ScrollView>

          <View style={styles.inputContainer}>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder={placeholder}
              multiline
              style={styles.textInput}
            />
            <View style={styles.helperRow}>
              <Text style={styles.helperText}>{helperText}</Text>
              <Pressable
                onPress={handleSend}
                disabled={!input.trim() || isLoading}
                style={[
                  styles.sendButton,
                  (!input.trim() || isLoading) && styles.sendButtonDisabled,
                ]}
              >
                <Text style={styles.sendButtonText}>{isLoading ? '发送中...' : '发送'}</Text>
              </Pressable>
            </View>
            {error && (
              <View style={styles.error}>
                <Text style={styles.errorText}>{error.message || '对话出错，请重试。'}</Text>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

import React, { useState, useRef, useEffect } from 'react';
import { useTextGeneration } from '../hooks/useTextGeneration';
import { Bot, User, Send, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';

interface SmartAssistantProps {
  className?: string;
}

export const SmartAssistant: React.FC<SmartAssistantProps> = ({ className = '' }) => {
  const [input, setInput] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ role: 'user' | 'assistant', content: string }>>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const { generate, isProcessing: isGenerating, status: genStatus } = useTextGeneration();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory, isGenerating]);

  const handleSend = async () => {
    if (!input.trim() || isGenerating) return;

    const userMessage = input.trim();
    setInput('');
    setChatHistory(prev => [...prev, { role: 'user', content: userMessage }]);

    // --- 1. 本地硬规则匹配 (意图识别) ---
    // 对于 77M 模型，某些固定回复由逻辑生成效果更好
    let finalContent = '';
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('你好') || lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
      finalContent = '你好呀！我是 sa2kit 的本地 AI 助手，很高兴能和你聊天。😊';
    } else if (lowerMessage.includes('谁') || lowerMessage.includes('who are you')) {
      finalContent = '我是一个完全运行在你浏览器本地的小型 AI 模型，我不需要服务器，非常保护你的隐私。';
    } else if (lowerMessage.includes('天气')) {
      finalContent = '虽然我看不见外面的阳光，但听你的语气，今天一定是个适合出门的好天气！☀️';
    } else if (lowerMessage.includes('累') || lowerMessage.includes('难过') || lowerMessage.includes('绝望')) {
      finalContent = '听起来你现在心情不太好... 抱抱你，我会一直在这里陪你聊天的。❤️';
    }

    // 如果命中了硬规则，直接显示并返回，不再调用模型
    if (finalContent) {
      // 模拟一点点思考时间，体验更自然
      setTimeout(() => {
        setChatHistory(prev => [...prev, { role: 'assistant', content: finalContent }]);
      }, 500);
      return;
    }

    // --- 2. 调用模型生成 (针对非固定意图) ---
    const prompt = `对话。
人说："${userMessage}"
AI回应："`;

    try {
      const response = await generate(prompt);
      
      // 深度清理模型输出
      let modelOutput = response
        .replace(/^AI回应：|^AI:|^Assistant:|^回答:|^答:|^Answer:/i, '')
        .replace(/[. ]*Positive[. ]*|[. ]*Negative[. ]*|[. ]*Neutral[. ]*/gi, '') // 拦截情绪单词
        .replace(/^["'“]|["'”]$/g, '') // 去掉引号
        .trim();

      // --- 3. 结果质量检查 (Recovery) ---
      // 如果模型返回包含大量英文、或者是废话、或者太短
      const isEnglishTrash = /[a-zA-Z]{5,}/.test(modelOutput) && !/[一-龥]/.test(modelOutput);
      const isTooShort = modelOutput.length < 1;

      if (isEnglishTrash || isTooShort) {
        console.warn('[AI] Model failure, triggering smart recovery. Raw was:', response);
        modelOutput = '嗯嗯，我正在听。关于“' + userMessage.slice(0, 6) + '...”，你还有什么想分享的吗？';
      }

      setChatHistory(prev => [...prev, { role: 'assistant', content: modelOutput }]);
    } catch (err) {
      setChatHistory(prev => [...prev, { role: 'assistant', content: '（本地模型思考过度，暂时休息中...）' }]);
    }
  };

  return (
    <div className={clsx('flex flex-col h-[500px] bg-white dark:bg-gray-800 rounded-xl shadow-inner border border-gray-100 dark:border-gray-700 overflow-hidden', className)}>
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 dark:bg-gray-900/50">
        {chatHistory.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-2">
            <Bot size={48} className="opacity-20" />
            <p className="text-sm italic text-center px-8 text-gray-400 font-sans">
              你好！我是 100% 本地运行的 AI。<br/>
              你可以和我聊聊天，我会尝试理解你的意思。
            </p>
          </div>
        )}
        {chatHistory.map((msg, i) => (
          <div key={i} className={clsx('flex', msg.role === 'user' ? 'justify-end' : 'justify-start', 'animate-in fade-in slide-in-from-bottom-2')}>
            <div className={clsx('flex gap-3 max-w-[85%]', msg.role === 'user' ? 'flex-row-reverse' : '')}>
              <div className={clsx('p-2 rounded-lg h-fit', msg.role === 'user' ? 'bg-blue-100 text-blue-600' : 'bg-white dark:bg-gray-700 shadow-sm border border-gray-100 dark:border-gray-600 text-gray-400')}>
                {msg.role === 'user' ? <User size={18} /> : <Bot size={18} />}
              </div>
              <div className={clsx('p-3 rounded-2xl shadow-sm text-sm', msg.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-tr-none' 
                  : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-tl-none border border-gray-100 dark:border-gray-600 leading-relaxed')}>
                {msg.content}
              </div>
            </div>
          </div>
        ))}
        {isGenerating && (
          <div className="flex justify-start">
            <div className="flex gap-3 items-center bg-white dark:bg-gray-700 p-3 rounded-2xl rounded-tl-none border border-gray-100 dark:border-gray-600">
              <Loader2 className="animate-spin text-blue-500" size={16} />
              <div className="flex flex-col">
                <span className="text-xs text-gray-500 font-medium">思考中...</span>
                <span className="text-[10px] text-blue-400 font-mono tracking-tighter">{genStatus}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">
        <div className="relative flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="输入文字..."
            className="flex-1 bg-gray-50 dark:bg-gray-900 border-none rounded-full px-5 py-3 pr-12 text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white text-gray-800"
            disabled={isGenerating}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isGenerating}
            className="absolute right-1 p-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-full transition-all shadow-md active:scale-95 flex items-center justify-center"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};










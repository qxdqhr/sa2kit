import React, { useState } from 'react';
import { useSentimentAnalysis } from '../hooks/useSentimentAnalysis';
import { MessageSquare, Send, Loader2, Smile, Frown, Meh } from 'lucide-react';

interface SentimentAnalyzerProps {
  onResult?: (result: any) => void;
  className?: string;
  placeholder?: string;
}

export const SentimentAnalyzer: React.FC<SentimentAnalyzerProps> = ({
  onResult,
  className = '',
  placeholder = '输入一段中文或英文，分析其情感倾向...',
}) => {
  const [text, setText] = useState('');
  const { analyze, isProcessing, status, result, error } = useSentimentAnalysis();

  const handleAnalyze = async () => {
    if (!text.trim() || isProcessing) return;
    try {
      const res = await analyze(text);
      onResult?.(res);
    } catch (err) {
      console.error('Sentiment Analysis Error:', err);
    }
  };

  const getSentimentIcon = () => {
    if (!result) return null;
    switch (result.sentiment) {
      case 'positive': return <Smile className="text-green-500" size={24} />;
      case 'negative': return <Frown className="text-red-500" size={24} />;
      default: return <Meh className="text-yellow-500" size={24} />;
    }
  };

  const getSentimentColor = () => {
    if (!result) return '';
    switch (result.sentiment) {
      case 'positive': return 'bg-green-50 border-green-200 text-green-700';
      case 'negative': return 'bg-red-50 border-red-200 text-red-700';
      default: return 'bg-yellow-50 border-yellow-200 text-yellow-700';
    }
  };

  return (
    <div className={`p-6 border rounded-xl bg-white dark:bg-gray-800 shadow-sm ${className}`}>
      <div className="flex items-center gap-2 mb-4 text-gray-700 dark:text-gray-300 font-medium">
        <MessageSquare size={20} />
        <span>文本情感分析</span>
      </div>

      <div className="relative">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder}
          className="w-full h-32 p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none resize-none text-gray-800 dark:text-gray-200"
          disabled={isProcessing}
        />
        <button
          onClick={handleAnalyze}
          disabled={!text.trim() || isProcessing}
          className="absolute bottom-3 right-3 p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-md transition-colors shadow-sm"
        >
          {isProcessing ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
        </button>
      </div>

      {isProcessing && (
        <div className="mt-4 flex items-center gap-2 text-sm text-blue-600 animate-pulse">
          <Loader2 size={14} className="animate-spin" />
          <span>正在分析 (首次运行将加载模型资源)...</span>
        </div>
      )}

      {result && !isProcessing && (
        <div className={`mt-4 p-4 border rounded-lg flex items-center gap-4 animate-in fade-in slide-in-from-top-2 ${getSentimentColor()}`}>
          <div className="p-2 bg-white rounded-full shadow-sm">
            {getSentimentIcon()}
          </div>
          <div>
            <p className="font-bold text-lg capitalize">{result.sentiment}</p>
            <p className="text-sm opacity-80">
              置信度: {(result.score * 100).toFixed(1)}% ({result.label})
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
          分析失败: {error.message}
        </div>
      )}
    </div>
  );
};


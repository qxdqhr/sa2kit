'use client';

import { useState, useRef, useEffect } from 'react';
import styles from '../styles';
import AudioPlayer from '../../components/AudioPlayer';

interface AudioUploaderProps {
  audioUrl: string | undefined;
  onAudioChange: (url: string | undefined) => void;
  placeholder?: string;
  className?: string;
}

/**
 * 音频上传和预览组件
 */
const AudioUploader = ({
  audioUrl,
  onAudioChange,
  placeholder = '选择音频文件或输入URL',
  className = '',
}: AudioUploaderProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [urlInputMode, setUrlInputMode] = useState(true);
  const [tempAudioUrl, setTempAudioUrl] = useState(audioUrl || '');
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 当外部的audioUrl变化时更新内部状态
  useEffect(() => {
    setTempAudioUrl(audioUrl || '');
  }, [audioUrl]);

  // 处理文件选择
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) {
      return;
    }

    const file = files[0];
    if (!file.type.includes('audio/')) {
      setError('请选择有效的音频文件');
      return;
    }

    try {
      setIsUploading(true);
      setError(null);
      setUploadProgress(0);

      // 创建临时的blob URL用于预览
      const objectUrl = URL.createObjectURL(file);
      setTempAudioUrl(objectUrl);

      // 模拟上传进度
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 300);

      // 上传文件到服务器
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload/audio', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval); // 清除模拟进度

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '上传失败');
      }

      const data = await response.json();
      setUploadProgress(100);

      // 短暂延迟，让用户看到上传已完成
      setTimeout(() => {
        // 上传成功后，将获取到的URL更新到父组件
        onAudioChange(data.url);
        
        // 清理临时URL
        URL.revokeObjectURL(objectUrl);
      }, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : '上传失败，请重试');
      console.error('上传失败:', err);
    } finally {
      setIsUploading(false);
    }
  };

  // 处理URL输入
  const handleUrlInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTempAudioUrl(e.target.value);
  };

  // 应用URL
  const handleApplyUrl = () => {
    onAudioChange(tempAudioUrl || undefined);
  };

  // 切换输入模式
  const handleToggleInputMode = () => {
    setUrlInputMode(!urlInputMode);
  };

  // 处理删除音频
  const handleDeleteAudio = () => {
    onAudioChange(undefined);
    setTempAudioUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 打开文件选择器
  const handleBrowseClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // 添加拖放功能
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      const input = fileInputRef.current;
      
      if (input && file.type.includes('audio/')) {
        // 创建一个新的文件列表
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        input.files = dataTransfer.files;
        
        // 触发change事件
        const event = new Event('change', { bubbles: true });
        input.dispatchEvent(event);
      } else {
        setError('请选择有效的音频文件');
      }
    }
  };

  return (
    <div className={`${styles.audioUploader} ${className}`}>
      <div className={styles.uploaderContent}>
        {urlInputMode ? (
          // URL输入模式
          <div className={styles.urlInputContainer}>
            <input
              type="text"
              className={styles.urlInput}
              value={tempAudioUrl}
              onChange={handleUrlInputChange}
              placeholder={placeholder}
              disabled={isUploading}
            />
            <div className={styles.urlActions}>
              <button
                className={styles.actionButton}
                onClick={handleApplyUrl}
                disabled={isUploading}
              >
                应用
              </button>
              <button
                className={styles.actionButton}
                onClick={handleToggleInputMode}
                disabled={isUploading}
              >
                上传文件
              </button>
            </div>
          </div>
        ) : (
          // 文件上传模式
          <div className={styles.fileUploadContainer}>
            <div 
              className={styles.uploadArea} 
              onClick={handleBrowseClick}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                className={styles.fileInput}
                onChange={handleFileSelect}
                disabled={isUploading}
              />
              <div className={styles.uploadIcon}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
              </div>
              <div className={styles.uploadText}>
                {isUploading ? '上传中...' : '点击或拖拽音频文件到此处'}
              </div>
              
              {isUploading && (
                <div className={styles.progressContainer}>
                  <div 
                    className={styles.progressBar} 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                  <div className={styles.progressText}>
                    {uploadProgress}%
                  </div>
                </div>
              )}
            </div>
            <button
              className={styles.actionButton}
              onClick={handleToggleInputMode}
              disabled={isUploading}
            >
              输入URL
            </button>
          </div>
        )}

        {/* 错误信息 */}
        {error && (
          <div className={styles.errorMessage}>{error}</div>
        )}

        {/* 音频预览 */}
        {audioUrl && (
          <div className={styles.previewContainer}>
            <div className={styles.previewHeader}>
              <div className={styles.previewTitle}>预览</div>
              <button
                className={styles.deleteButton}
                onClick={handleDeleteAudio}
                disabled={isUploading}
              >
                删除
              </button>
            </div>
            <AudioPlayer
              audioUrl={audioUrl}
              className={styles.previewPlayer}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default AudioUploader; 
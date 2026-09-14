'use client';

import { useState, useEffect } from 'react';
import { ResultModalData } from '../types';
import styles from '../styles';

interface ResultsConfigProps {
  resultModalData: ResultModalData;
  onResultModalChange: (resultModal: ResultModalData) => void;
}

const ResultsConfig = ({ resultModalData, onResultModalChange }: ResultsConfigProps) => {
  // 更新标题
  const updateTitle = (title: string) => {
    onResultModalChange({
      ...resultModalData,
      title
    });
  };
  
  // 更新延迟时间
  const updateShowDelayTime = (showDelayTime: number) => {
    onResultModalChange({
      ...resultModalData,
      showDelayTime
    });
  };
  
  // 更新及格消息
  const updatePassMessage = (pass: string) => {
    onResultModalChange({
      ...resultModalData,
      messages: {
        ...resultModalData.messages,
        pass
      }
    });
  };
  
  // 更新不及格消息
  const updateFailMessage = (fail: string) => {
    onResultModalChange({
      ...resultModalData,
      messages: {
        ...resultModalData.messages,
        fail
      }
    });
  };
  
  // 更新按钮文本
  const updateButtonText = (buttonText: string) => {
    onResultModalChange({
      ...resultModalData,
      buttonText
    });
  };
  
  // 更新及格分数线
  const updatePassingScore = (passingScore: number) => {
    onResultModalChange({
      ...resultModalData,
      passingScore
    });
  };
  
  return (
    <div>
      <h2 className={styles.sectionTitle}>结果页配置</h2>
      <p className={styles.sectionDescription}>
        配置考试结果页的内容，包括标题、消息和按钮文本等。
      </p>
      
      <div className={styles.formGroup}>
        <label className={styles.formLabel}>标题</label>
        <input
          type="text"
          className={styles.formInput}
          value={resultModalData.title}
          onChange={(e) => updateTitle(e.target.value)}
          placeholder="输入结果页标题..."
        />
      </div>
      
      <div className={styles.formGroup}>
        <label className={styles.formLabel}>弹窗延迟时间（毫秒）</label>
        <input
          type="number"
          className={styles.formInput}
          value={resultModalData.showDelayTime}
          onChange={(e) => updateShowDelayTime(parseInt(e.target.value) || 0)}
          placeholder="输入延迟时间..."
          min="0"
        />
      </div>
      
      <div className={styles.formGroup}>
        <label className={styles.formLabel}>及格消息</label>
        <textarea
          className={styles.formTextarea}
          value={resultModalData.messages.pass}
          onChange={(e) => updatePassMessage(e.target.value)}
          placeholder="输入及格时显示的消息..."
        />
      </div>
      
      <div className={styles.formGroup}>
        <label className={styles.formLabel}>不及格消息</label>
        <textarea
          className={styles.formTextarea}
          value={resultModalData.messages.fail}
          onChange={(e) => updateFailMessage(e.target.value)}
          placeholder="输入不及格时显示的消息..."
        />
      </div>
      
      <div className={styles.formGroup}>
        <label className={styles.formLabel}>按钮文本</label>
        <input
          type="text"
          className={styles.formInput}
          value={resultModalData.buttonText}
          onChange={(e) => updateButtonText(e.target.value)}
          placeholder="输入按钮文本..."
        />
      </div>
      
      <div className={styles.formGroup}>
        <label className={styles.formLabel}>及格分数线（百分比）</label>
        <input
          type="number"
          className={styles.formInput}
          value={resultModalData.passingScore}
          onChange={(e) => updatePassingScore(parseInt(e.target.value) || 0)}
          placeholder="输入及格分数线..."
          min="0"
          max="100"
        />
      </div>
      
      <div className={styles.previewSection}>
        <h3 className={styles.sectionTitle}>预览</h3>
        <div className={styles.previewContainer}>
          <h2>{resultModalData.title || '结果页标题'}</h2>
          
          <div className={styles.modalPreview}>
            <h3>及格消息:</h3>
            <p>{resultModalData.messages.pass || '及格时显示的消息'}</p>
            
            <h3>不及格消息:</h3>
            <p>{resultModalData.messages.fail || '不及格时显示的消息'}</p>
            
            <button className={styles.previewButton}>
              {resultModalData.buttonText || '关闭'}
            </button>
          </div>
          
          <p>延迟显示时间: {resultModalData.showDelayTime} 毫秒</p>
          <p>及格分数线: {resultModalData.passingScore}%</p>
        </div>
      </div>
    </div>
  );
};

export default ResultsConfig; 
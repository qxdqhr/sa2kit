'use client';

import { StartScreenData } from '../types';
import styles from '../styles';

interface StartScreenConfigProps {
  startScreenData: StartScreenData;
  onStartScreenChange: (startScreen: StartScreenData) => void;
}

const StartScreenConfig = ({ startScreenData, onStartScreenChange }: StartScreenConfigProps) => {
  // 更新标题
  const updateTitle = (title: string) => {
    onStartScreenChange({
      ...startScreenData,
      title
    });
  };
  
  // 更新描述
  const updateDescription = (description: string) => {
    onStartScreenChange({
      ...startScreenData,
      description
    });
  };
  
  // 更新规则标题
  const updateRulesTitle = (title: string) => {
    onStartScreenChange({
      ...startScreenData,
      rules: {
        ...startScreenData.rules,
        title
      }
    });
  };
  
  // 更新规则项
  const updateRuleItem = (index: number, content: string) => {
    const updatedItems = [...startScreenData.rules.items];
    updatedItems[index] = content;
    
    onStartScreenChange({
      ...startScreenData,
      rules: {
        ...startScreenData.rules,
        items: updatedItems
      }
    });
  };
  
  // 添加规则项
  const addRuleItem = () => {
    onStartScreenChange({
      ...startScreenData,
      rules: {
        ...startScreenData.rules,
        items: [...startScreenData.rules.items, '']
      }
    });
  };
  
  // 删除规则项
  const deleteRuleItem = (index: number) => {
    const updatedItems = startScreenData.rules.items.filter((_: string, i: number) => i !== index);
    
    onStartScreenChange({
      ...startScreenData,
      rules: {
        ...startScreenData.rules,
        items: updatedItems
      }
    });
  };
  
  // 更新按钮文本
  const updateButtonText = (buttonText: string) => {
    onStartScreenChange({
      ...startScreenData,
      buttonText
    });
  };
  
  return (
    <div>
      <h2 className={styles.sectionTitle}>启动页配置</h2>
      <p className={styles.sectionDescription}>
        配置考试启动页的内容，包括标题、描述和规则等。
      </p>
      
      <div className={styles.formGroup}>
        <label className={styles.formLabel}>标题</label>
        <input
          type="text"
          className={styles.formInput}
          value={startScreenData.title}
          onChange={(e) => updateTitle(e.target.value)}
          placeholder="输入考试标题..."
        />
      </div>
      
      <div className={styles.formGroup}>
        <label className={styles.formLabel}>描述</label>
        <textarea
          className={styles.formTextarea}
          value={startScreenData.description}
          onChange={(e) => updateDescription(e.target.value)}
          placeholder="输入考试描述..."
        />
      </div>
      
      <div className={styles.formGroup}>
        <label className={styles.formLabel}>规则标题</label>
        <input
          type="text"
          className={styles.formInput}
          value={startScreenData.rules.title}
          onChange={(e) => updateRulesTitle(e.target.value)}
          placeholder="输入规则标题..."
        />
      </div>
      
      <div className={styles.formGroup}>
        <label className={styles.formLabel}>规则项</label>
        {startScreenData.rules.items.map((item: string, index: number) => (
          <div key={index} className={styles.optionItem}>
            <div className={styles.optionHeader}>
              <input
                type="text"
                className={styles.formInput}
                value={item}
                onChange={(e) => updateRuleItem(index, e.target.value)}
                placeholder={`规则项 ${index + 1}`}
              />
              <button
                className={styles.removeButton}
                onClick={() => deleteRuleItem(index)}
              >
                删除
              </button>
            </div>
          </div>
        ))}
        
        <button
          className={styles.addButton}
          onClick={addRuleItem}
        >
          + 添加规则项
        </button>
      </div>
      
      <div className={styles.formGroup}>
        <label className={styles.formLabel}>按钮文本</label>
        <input
          type="text"
          className={styles.formInput}
          value={startScreenData.buttonText}
          onChange={(e) => updateButtonText(e.target.value)}
          placeholder="输入按钮文本..."
        />
      </div>
      
      <div className={styles.previewSection}>
        <h3 className={styles.sectionTitle}>预览</h3>
        <div className={styles.previewContainer}>
          <h2>{startScreenData.title || '考试标题'}</h2>
          <p>{startScreenData.description || '考试描述'}</p>
          
          <div className={styles.modalPreview}>
            <h3>{startScreenData.rules.title || '规则标题'}</h3>
            <ul>
              {startScreenData.rules.items.map((item: string, index: number) => (
                <li key={index}>{item || `规则项 ${index + 1}`}</li>
              ))}
            </ul>
          </div>
          
          <button className={styles.previewButton}>
            {startScreenData.buttonText || '开始考试'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StartScreenConfig; 
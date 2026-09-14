"use client";

import { useExam } from '../context';
import styles from '../styles';

const SpecialNoticeModal = () => {
  const { specialModalOpen, specialModalData, closeSpecialModal } = useExam();
  
  if (!specialModalOpen || !specialModalData) {
    return null;
  }

  return (
    <div className={styles["modal-overlay"]} onClick={closeSpecialModal}>
      <div 
        className={styles["special-modal"]}
        onClick={(e) => e.stopPropagation()} // 防止点击弹窗内容时关闭
      >
        {specialModalData.title && (
          <h2 className={styles["special-title"]}>{specialModalData.title}</h2>
        )}
        
        <div className={styles["special-content"]}>
          {specialModalData.content || "这是一道特殊题目，请仔细作答！"}
        </div>
        
        {specialModalData.imageUrl && (
          <img 
            src={specialModalData.imageUrl} 
            alt="提示图片" 
            className={styles["special-image"]}
          />
        )}
        
        <button 
          className={styles["special-close-btn"]}
          onClick={closeSpecialModal}
        >
          {specialModalData.buttonText || "我知道了"}
        </button>
      </div>
    </div>
  );
};

export default SpecialNoticeModal; 
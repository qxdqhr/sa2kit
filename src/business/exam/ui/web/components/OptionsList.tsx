"use client";

import { useExam } from '../context';
import { QuestionType } from '../types';
import styles from '../styles';
import AudioPlayer from './AudioPlayer';

const OptionsList = () => {
  const { 
    currentQuestion, 
    isOptionSelected, 
    handleSingleChoiceAnswer, 
    handleMultipleChoiceAnswer,
    isMobile
  } = useExam();
  
  if (
    currentQuestion.type !== QuestionType.SingleChoice &&
    currentQuestion.type !== QuestionType.MultipleChoice
  ) {
    return null;
  }
  
  return (
    <div className={styles["options-container"]}>
      {currentQuestion.options.map((option) => {
        const isSelected = isOptionSelected(option.id);
        
        return (
          <div 
            key={option.id} 
            className={`${styles["option-item"]} ${isSelected ? styles.selected : ''}`}
            onClick={() => {
              if (currentQuestion.type === QuestionType.SingleChoice) {
                handleSingleChoiceAnswer(currentQuestion.id, option.id);
              } else if (currentQuestion.type === QuestionType.MultipleChoice) {
                handleMultipleChoiceAnswer(
                  currentQuestion.id,
                  option.id,
                  !isSelected
                );
              }
            }}
          >
            <div className={styles["option-content"]}>
              <div className={styles["radio-container"]}>
                {currentQuestion.type === QuestionType.SingleChoice ? (
                  <div className={`${styles["radio-circle"]} ${isSelected ? styles.selected : ''}`}>
                    {isSelected && (
                      <div className={styles["radio-inner"]} />
                    )}
                  </div>
                ) : (
                  <div className={`${styles.checkbox} ${isSelected ? styles.selected : ''}`}>
                    {isSelected && (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="white"
                        style={{ width: '12px', height: '12px' }}
                      >
                        <path
                          fillRule="evenodd"
                          d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                )}
              </div>
              
              <div className={styles["option-text"]}>
                <div>{option.content}</div>
                
                {option.audioUrl && (
                  <AudioPlayer 
                    audioUrl={option.audioUrl}
                    className={styles.optionAudioPlayer}
                  />
                )}
                
                {option.imageUrl && (
                  <div>
                    <img 
                      src={option.imageUrl} 
                      alt="选项图片" 
                      className={styles["option-image"]}
                      style={{ maxHeight: isMobile ? '80px' : '100px' }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default OptionsList; 
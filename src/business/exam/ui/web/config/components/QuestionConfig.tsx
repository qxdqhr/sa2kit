'use client';

import { useState } from 'react';
import {
  Question,
  QuestionType,
  SpecialEffectType,
  SingleChoiceQuestion,
  MultipleChoiceQuestion,
  FillBlankQuestion,
} from '../types';
import styles from '../styles';
import AudioUploader from './AudioUploader';

interface QuestionConfigProps {
  questions: Question[];
  onQuestionsChange: (questions: Question[]) => void;
}

const QuestionConfig = ({ questions, onQuestionsChange }: QuestionConfigProps) => {
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);
  const [expandedOptionId, setExpandedOptionId] = useState<string | null>(null);
  const [showSpecialEffects, setShowSpecialEffects] = useState<Record<string, boolean>>({});

  // 切换问题的展开/折叠状态
  const toggleQuestionExpanded = (questionId: string) => {
    setExpandedQuestionId(expandedQuestionId === questionId ? null : questionId);
  };

  // 切换选项的展开/折叠状态
  const toggleOptionExpanded = (optionId: string) => {
    setExpandedOptionId(expandedOptionId === optionId ? null : optionId);
  };

  // 切换特效编辑显示
  const toggleSpecialEffects = (questionId: string) => {
    setShowSpecialEffects(prev => ({
      ...prev,
      [questionId]: !prev[questionId]
    }));
  };

  // 更新问题
  const updateQuestion = (questionId: string, updatedFields: Partial<Question>) => {
    const updatedQuestions = questions.map(question => 
      question.id === questionId 
        ? { ...question, ...updatedFields } as Question  
        : question
    );
    onQuestionsChange(updatedQuestions);
  };

  // 更新问题内容
  const updateQuestionContent = (questionId: string, content: string) => {
    updateQuestion(questionId, { content });
  };

  // 更新问题分数
  const updateQuestionScore = (questionId: string, score: number) => {
    updateQuestion(questionId, { score });
  };

  // 更新问题类型
  const updateQuestionType = (questionId: string, type: QuestionType) => {
    const question = questions.find(q => q.id === questionId);
    if (!question) return;

    // 根据类型创建新问题
    let updatedQuestion: Question;
    if (type === QuestionType.SingleChoice) {
      updatedQuestion = {
        ...question,
        type,
        options: question.type === QuestionType.MultipleChoice 
          ? question.options || []
          : [{ id: `${questionId}_option_1`, content: '' }],
        answer: '',
      } as any;
    } else if (type === QuestionType.MultipleChoice) {
      updatedQuestion = {
        ...question,
        type,
        options: question.type === QuestionType.SingleChoice 
          ? question.options || []
          : [{ id: `${questionId}_option_1`, content: '' }],
        answers: [],
      } as any;
    } else if (type === QuestionType.FillBlank) {
      updatedQuestion = {
        ...question,
        type,
        answers: question.type === QuestionType.FillBlank ? (question as any).answers || [] : [],
      } as any;
    } else {
      updatedQuestion = {
        ...question,
        type,
      } as any;
    }

    updateQuestion(questionId, updatedQuestion);
  };

  // 更新问题图片URL
  const updateQuestionImageUrl = (questionId: string, imageUrl: string) => {
    updateQuestion(questionId, { imageUrl });
  };

  // 更新问题音频URL
  const updateQuestionAudioUrl = (questionId: string, audioUrl: string) => {
    updateQuestion(questionId, { audioUrl });
  };

  // 更新单选题答案
  const updateSingleAnswer = (questionId: string, optionId: string) => {
    updateQuestion(questionId, { answer: optionId } as any);
  };

  // 更新多选题答案
  const updateMultipleAnswer = (questionId: string, optionId: string, isSelected: boolean) => {
    const question = questions.find(q => q.id === questionId) as any;
    if (!question) return;

    let updatedAnswers = [...(question.answers || [])];

    if (isSelected) {
      if (!updatedAnswers.includes(optionId)) {
        updatedAnswers.push(optionId);
      }
    } else {
      updatedAnswers = updatedAnswers.filter(id => id !== optionId);
    }

    updateQuestion(questionId, { answers: updatedAnswers } as any);
  };

  // 更新填空题答案（逗号分隔）
  const updateFillBlankAnswers = (questionId: string, answersText: string) => {
    const answers = answersText
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    updateQuestion(questionId, { answers } as any);
  };

  // 添加选项
  const addOption = (questionId: string) => {
    const question = questions.find(q => q.id === questionId) as any;
    if (!question || !question.options) return;
    
    const newOptionId = `${questionId}_option_${question.options.length + 1}`;
    const newOption = {
      id: newOptionId,
      content: '',
    };
    
    updateQuestion(questionId, { 
      options: [...question.options, newOption]
    } as any);
  };

  // 更新选项
  const updateOption = (questionId: string, optionId: string, content: string) => {
    const question = questions.find(q => q.id === questionId);
    if (
      !question || 
      (question.type !== QuestionType.SingleChoice && question.type !== QuestionType.MultipleChoice)
    ) return;
    
    const choiceQuestion = question as SingleChoiceQuestion | MultipleChoiceQuestion;
    const updatedOptions = choiceQuestion.options.map((option) => 
      option.id === optionId ? { ...option, content } : option
    );
    
    updateQuestion(questionId, { options: updatedOptions } as any);
  };

  // 更新选项图片URL
  const updateOptionImageUrl = (questionId: string, optionId: string, imageUrl: string) => {
    const question = questions.find(q => q.id === questionId);
    if (
      !question || 
      (question.type !== QuestionType.SingleChoice && question.type !== QuestionType.MultipleChoice)
    ) return;
    
    const choiceQuestion = question as SingleChoiceQuestion | MultipleChoiceQuestion;
    const updatedOptions = choiceQuestion.options.map((option) => 
      option.id === optionId ? { ...option, imageUrl } : option
    );
    
    updateQuestion(questionId, { options: updatedOptions } as any);
  };

  // 更新选项音频URL
  const updateOptionAudioUrl = (questionId: string, optionId: string, audioUrl: string) => {
    const question = questions.find(q => q.id === questionId);
    if (
      !question || 
      (question.type !== QuestionType.SingleChoice && 
       question.type !== QuestionType.MultipleChoice)
    ) return;
    
    const choiceQuestion = question as SingleChoiceQuestion | MultipleChoiceQuestion;
    const updatedOptions = choiceQuestion.options.map((option) => 
      option.id === optionId ? { ...option, audioUrl } : option
    );
    
    updateQuestion(questionId, { options: updatedOptions } as any);
  };

  // 删除选项
  const deleteOption = (questionId: string, optionId: string) => {
    const question = questions.find(q => q.id === questionId);
    if (
      !question || 
      (question.type !== QuestionType.SingleChoice && question.type !== QuestionType.MultipleChoice)
    ) return;
    
    const choiceQuestion = question as SingleChoiceQuestion | MultipleChoiceQuestion;
    
    // 移除选项
    const updatedOptions = choiceQuestion.options.filter((option) => option.id !== optionId);
    
    // 如果是单选题，并且删除的是当前选中的选项
    let updatedFields: any = { options: updatedOptions };
    if (question.type === QuestionType.SingleChoice && question.answer === optionId) {
      updatedFields.answer = '';
    }
    
    // 如果是多选题，从答案中移除这个选项
    if (question.type === QuestionType.MultipleChoice && question.answers) {
      updatedFields.answers = question.answers.filter((id: string) => id !== optionId);
    }
    
    updateQuestion(questionId, updatedFields);
  };

  // 添加问题
  const addQuestion = () => {
    const newQuestionId = `question_${Date.now()}`;
    const newQuestion: Question = {
      id: newQuestionId,
      type: QuestionType.SingleChoice,
      content: '',
      score: 1,
      options: [
        { id: `${newQuestionId}_option_1`, content: '' },
        { id: `${newQuestionId}_option_2`, content: '' },
      ],
      answer: '',
    } as any;
    
    onQuestionsChange([...questions, newQuestion]);
    setExpandedQuestionId(newQuestionId);
  };

  // 删除问题
  const deleteQuestion = (questionId: string) => {
    const updatedQuestions = questions.filter(question => question.id !== questionId);
    onQuestionsChange(updatedQuestions);
    if (expandedQuestionId === questionId) {
      setExpandedQuestionId(null);
    }
  };

  // 添加特效
  const addSpecialEffect = (questionId: string, effectType: SpecialEffectType) => {
    const question = questions.find(q => q.id === questionId);
    if (!question) return;
    
    let specialEffect: any = { type: effectType };
    
    // 为弹窗类型添加默认字段
    if (effectType === SpecialEffectType.ModalPop) {
      specialEffect = {
        ...specialEffect,
        title: '提示',
        content: '',
        buttonText: '我知道了',
      };
    }
    
    updateQuestion(questionId, { specialEffect });
  };

  // 更新特效字段
  const updateSpecialEffectField = (questionId: string, fieldName: string, value: string) => {
    const question = questions.find(q => q.id === questionId);
    if (!question || !question.specialEffect) return;
    
    const updatedEffect = {
      ...question.specialEffect,
      [fieldName]: value,
    };
    
    updateQuestion(questionId, { specialEffect: updatedEffect });
  };

  // 删除特效
  const removeSpecialEffect = (questionId: string) => {
    updateQuestion(questionId, { specialEffect: undefined });
  };

  // 上移题目
  const moveQuestionUp = (questionId: string) => {
    const index = questions.findIndex(q => q.id === questionId);
    if (index <= 0) return; // 已经是第一个，不能上移
    
    const updatedQuestions = [...questions];
    // 交换当前题目与前一个题目
    [updatedQuestions[index], updatedQuestions[index - 1]] = [updatedQuestions[index - 1], updatedQuestions[index]];
    
    onQuestionsChange(updatedQuestions);
  };
  
  // 下移题目
  const moveQuestionDown = (questionId: string) => {
    const index = questions.findIndex(q => q.id === questionId);
    if (index === -1 || index >= questions.length - 1) return; // 已经是最后一个，不能下移
    
    const updatedQuestions = [...questions];
    // 交换当前题目与后一个题目
    [updatedQuestions[index], updatedQuestions[index + 1]] = [updatedQuestions[index + 1], updatedQuestions[index]];
    
    onQuestionsChange(updatedQuestions);
  };

  return (
    <div>
      <h2 className={styles.sectionTitle}>试题管理</h2>
      <p className={styles.sectionDescription}>
        在这里配置考试的问题，包括单选题、多选题等。
      </p>
      
      <div className={styles.questionList}>
        {questions.map(question => (
          <div key={question.id} className={styles.questionItem}>
            <div 
              className={`${styles.questionHeader} ${expandedQuestionId !== question.id ? styles.clickable : ''}`}
              onClick={(e) => {
                // 如果点击的是按钮区域，则不处理以避免冲突
                if ((e.target as HTMLElement).tagName === 'BUTTON' || 
                    (e.target as HTMLElement).closest('button')) {
                  return;
                }
                toggleQuestionExpanded(question.id);
              }}
            >
              <div className={styles.questionTitle}>
                <span className={styles.questionNumber}>{questions.indexOf(question) + 1}. </span>
                {question.content || '新问题'}
                {expandedQuestionId !== question.id && <span className={styles.editHint}>点击展开编辑</span>}
              </div>
              <div onClick={(e) => e.stopPropagation()}>
                <button
                  className={styles.moveButton}
                  onClick={() => moveQuestionUp(question.id)}
                  disabled={questions.indexOf(question) === 0}
                  title="上移题目"
                >
                  ↑
                </button>
                <button
                  className={styles.moveButton}
                  onClick={() => moveQuestionDown(question.id)}
                  disabled={questions.indexOf(question) === questions.length - 1}
                  title="下移题目"
                >
                  ↓
                </button>
                <button
                  className={styles.expandButton}
                  onClick={() => toggleQuestionExpanded(question.id)}
                >
                  {expandedQuestionId === question.id ? '收起' : '编辑'}
                </button>
                <button
                  className={styles.removeButton}
                  onClick={() => deleteQuestion(question.id)}
                >
                  删除
                </button>
              </div>
            </div>
            
            {expandedQuestionId === question.id && (
              <div className={styles.questionDetails}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>问题内容</label>
                  <textarea
                    className={styles.formTextarea}
                    value={question.content}
                    onChange={(e) => updateQuestionContent(question.id, e.target.value)}
                    placeholder="输入问题内容..."
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>问题类型</label>
                  <select
                    className={styles.formSelect}
                    value={question.type}
                    onChange={(e) => updateQuestionType(question.id, e.target.value as QuestionType)}
                  >
                    <option value={QuestionType.SingleChoice}>单选题</option>
                    <option value={QuestionType.MultipleChoice}>多选题</option>
                    <option value={QuestionType.FillBlank}>填空题</option>
                  </select>
                </div>
                
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>分值</label>
                  <input
                    type="number"
                    className={styles.formInput}
                    value={question.score}
                    onChange={(e) => updateQuestionScore(question.id, parseInt(e.target.value) || 0)}
                    min="0"
                    max="100"
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>问题图片URL (可选)</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={question.imageUrl || ''}
                    onChange={(e) => updateQuestionImageUrl(question.id, e.target.value)}
                    placeholder="输入图片URL..."
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>问题音频 (可选)</label>
                  <AudioUploader
                    audioUrl={question.audioUrl}
                    onAudioChange={(url) => updateQuestionAudioUrl(question.id, url || '')}
                    placeholder="输入音频URL或上传音频文件"
                  />
                </div>
                
                {(question.type === QuestionType.SingleChoice || question.type === QuestionType.MultipleChoice) && (
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>选项</label>
                    <div className={styles.optionList}>
                      {(question.type === QuestionType.SingleChoice
                        ? (question as SingleChoiceQuestion).options
                        : (question as MultipleChoiceQuestion).options
                      ).map((option) => (
                        <div key={option.id} className={styles.optionItem}>
                          <div className={styles.optionHeader}>
                            {question.type === QuestionType.SingleChoice && (
                              <input
                                type="radio"
                                name={`answer_${question.id}`}
                                checked={(question as any).answer === option.id}
                                onChange={() => updateSingleAnswer(question.id, option.id)}
                              />
                            )}

                            {question.type === QuestionType.MultipleChoice && (
                              <input
                                type="checkbox"
                                checked={(question as any).answers?.includes(option.id)}
                                onChange={(e) => updateMultipleAnswer(question.id, option.id, e.target.checked)}
                              />
                            )}

                            <input
                              type="text"
                              className={styles.formInput}
                              value={option.content}
                              onChange={(e) => updateOption(question.id, option.id, e.target.value)}
                              placeholder="选项内容..."
                            />

                            <button
                              className={styles.expandButton}
                              onClick={() => toggleOptionExpanded(option.id)}
                            >
                              {expandedOptionId === option.id ? '收起' : '详情'}
                            </button>

                            <button
                              className={styles.removeButton}
                              onClick={() => deleteOption(question.id, option.id)}
                            >
                              删除
                            </button>
                          </div>

                          {expandedOptionId === option.id && (
                            <div className={styles.optionDetails}>
                              <div className={styles.formGroup}>
                                <label className={styles.formLabel}>选项图片URL (可选)</label>
                                <input
                                  type="text"
                                  className={styles.formInput}
                                  value={option.imageUrl || ''}
                                  onChange={(e) => updateOptionImageUrl(question.id, option.id, e.target.value)}
                                  placeholder="输入图片URL..."
                                />
                              </div>
                              <div className={styles.formGroup}>
                                <label className={styles.formLabel}>选项音频 (可选)</label>
                                <AudioUploader
                                  audioUrl={option.audioUrl}
                                  onAudioChange={(url) => updateOptionAudioUrl(question.id, option.id, url || '')}
                                  placeholder="输入音频URL或上传音频文件"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      ))}

                      <button
                        className={styles.addButton}
                        onClick={() => addOption(question.id)}
                      >
                        + 添加选项
                      </button>
                    </div>
                  </div>
                )}

                {question.type === QuestionType.FillBlank && (
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>填空答案（使用英文逗号分隔多个空）</label>
                    <textarea
                      className={styles.formTextarea}
                      value={((question as FillBlankQuestion).answers || []).join(', ')}
                      onChange={(e) => updateFillBlankAnswers(question.id, e.target.value)}
                      placeholder="例如: 北京, 上海"
                    />
                  </div>
                )}
                
                <div className={styles.formGroup}>
                  <div className={styles.effectHeader}>
                    <label className={styles.formLabel}>特殊效果</label>
                    <button
                      className={styles.expandButton}
                      onClick={() => toggleSpecialEffects(question.id)}
                    >
                      {showSpecialEffects[question.id] ? '收起' : '展开'}
                    </button>
                  </div>
                  
                  {showSpecialEffects[question.id] && (
                    <div>
                      {question.specialEffect ? (
                        <div className={styles.specialEffect}>
                          <div className={styles.effectHeader}>
                            <span>
                              {question.specialEffect.type === SpecialEffectType.ModalPop && '弹窗效果'}
                              {question.specialEffect.type === SpecialEffectType.TextShake && '文字抖动效果'}
                              {question.specialEffect.type === SpecialEffectType.TextFlash && '文字闪烁效果'}
                            </span>
                            <button
                              className={styles.removeButton}
                              onClick={() => removeSpecialEffect(question.id)}
                            >
                              移除效果
                            </button>
                          </div>
                          
                          {question.specialEffect.type === SpecialEffectType.ModalPop && (
                            <div className={styles.modalEffectFields}>
                              <div className={styles.formGroup}>
                                <label className={styles.formLabel}>标题</label>
                                <input
                                  type="text"
                                  className={styles.formInput}
                                  value={(question.specialEffect as any).title || ''}
                                  onChange={(e) => updateSpecialEffectField(question.id, 'title', e.target.value)}
                                  placeholder="弹窗标题..."
                                />
                              </div>
                              
                              <div className={styles.formGroup}>
                                <label className={styles.formLabel}>内容</label>
                                <textarea
                                  className={styles.formTextarea}
                                  value={(question.specialEffect as any).content || ''}
                                  onChange={(e) => updateSpecialEffectField(question.id, 'content', e.target.value)}
                                  placeholder="弹窗内容..."
                                />
                              </div>
                              
                              <div className={styles.formGroup}>
                                <label className={styles.formLabel}>按钮文本</label>
                                <input
                                  type="text"
                                  className={styles.formInput}
                                  value={(question.specialEffect as any).buttonText || '我知道了'}
                                  onChange={(e) => updateSpecialEffectField(question.id, 'buttonText', e.target.value)}
                                  placeholder="按钮文本..."
                                />
                              </div>
                              
                              <div className={styles.formGroup}>
                                <label className={styles.formLabel}>图片URL (可选)</label>
                                <input
                                  type="text"
                                  className={styles.formInput}
                                  value={(question.specialEffect as any).imageUrl || ''}
                                  onChange={(e) => updateSpecialEffectField(question.id, 'imageUrl', e.target.value)}
                                  placeholder="弹窗图片URL..."
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className={styles.addEffectButtons}>
                          <button
                            className={styles.effectButton}
                            onClick={() => addSpecialEffect(question.id, SpecialEffectType.ModalPop)}
                          >
                            添加弹窗效果
                          </button>
                          <button
                            className={styles.effectButton}
                            onClick={() => addSpecialEffect(question.id, SpecialEffectType.TextShake)}
                          >
                            添加文字抖动效果
                          </button>
                          <button
                            className={styles.effectButton}
                            onClick={() => addSpecialEffect(question.id, SpecialEffectType.TextFlash)}
                          >
                            添加文字闪烁效果
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
        
        <button
          className={styles.addButton}
          onClick={addQuestion}
        >
          + 添加问题
        </button>
      </div>
    </div>
  );
};

export default QuestionConfig; 
'use client';

import { useState, useEffect } from 'react';
import styles from '../styles';
import { EXAM_TYPE_MAP } from '../types';
import Link from 'next/link';
import { 
  getAllExamTypes, 
  createExamType, 
  deleteExamType,
  getExamTypeDetails
} from '../services/examManagement';

interface ExamTypeOption {
  value: string;
  label: string;
}

interface ExamManagementProps {
  onExamCreated: (type: string) => void;
  examTypeOptions: ExamTypeOption[];
}

interface ExamTypeDetail {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  lastModified: string;
  questionCount: number;
}

export default function ExamManagement({ onExamCreated, examTypeOptions }: ExamManagementProps) {
  const [examTypes, setExamTypes] = useState<ExamTypeDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newExamData, setNewExamData] = useState({
    id: '',
    name: '',
    description: '',
  });
  const [formError, setFormError] = useState('');

  // 加载所有试卷类型
  useEffect(() => {
    const loadExamTypes = async () => {
      setIsLoading(true);
      try {
        const types = await getAllExamTypes();
        // 获取每个试卷类型的详细信息
        const detailsPromises = types.map(type => getExamTypeDetails(type));
        const details = await Promise.all(detailsPromises);
        setExamTypes(details);
        setError('');
      } catch (err) {
        console.error('加载试卷类型失败:', err);
        setError('加载试卷类型失败，请重试');
      } finally {
        setIsLoading(false);
      }
    };

    loadExamTypes();
  }, []);

  // 处理创建新试卷
  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 表单验证
    if (!newExamData.id || !newExamData.name) {
      setFormError('试卷ID和名称为必填项');
      return;
    }

    // 检查ID格式
    if (!/^[a-z0-9_-]+$/.test(newExamData.id)) {
      setFormError('试卷ID只能包含小写字母、数字、下划线和连字符');
      return;
    }

    // 检查ID是否已存在
    if (examTypes.some(type => type.id === newExamData.id)) {
      setFormError('此试卷ID已存在，请使用其他ID');
      return;
    }

    setIsLoading(true);
    setFormError('');

    try {
      await createExamType(
        newExamData.id,
        newExamData.name,
        newExamData.description
      );
      
      // 更新试卷类型列表
      const newExam = await getExamTypeDetails(newExamData.id);
      setExamTypes([...examTypes, newExam]);
      
      // 重置表单
      setNewExamData({
        id: '',
        name: '',
        description: '',
      });
      setShowCreateForm(false);
      
      // 通知父组件
      onExamCreated(newExamData.id);
    } catch (err) {
      console.error('创建试卷失败:', err);
      setFormError('创建试卷失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 处理删除试卷
  const handleDeleteExam = async (id: string) => {
    if (id === 'default' || id === 'arknights') {
      setError('无法删除系统默认试卷');
      return;
    }

    if (!confirm(`确定要删除试卷 "${examTypes.find(type => type.id === id)?.name}" 吗？此操作不可恢复。`)) {
      return;
    }

    setIsLoading(true);
    try {
      await deleteExamType(id);
      // 更新试卷类型列表
      setExamTypes(examTypes.filter(type => type.id !== id));
      setError('');
    } catch (err) {
      console.error('删除试卷失败:', err);
      setError('删除试卷失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.examManagement}>
      <div className={styles.header}>
        <h1 className={styles.title}>试卷管理</h1>
        <button 
          className={styles.createButton}
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          {showCreateForm ? '取消' : '创建新试卷'}
        </button>
      </div>

      {error && <div className={styles.errorMessage}>{error}</div>}

      {/* 创建新试卷表单 */}
      {showCreateForm && (
        <div className={styles.createFormContainer}>
          <h2 className={styles.formTitle}>创建新试卷</h2>
          {formError && <div className={styles.errorMessage}>{formError}</div>}
          <form onSubmit={handleCreateExam} className={styles.createForm}>
            <div className={styles.formGroup}>
              <label htmlFor="exam-id" className={styles.formLabel}>试卷ID（唯一标识符）</label>
              <input
                id="exam-id"
                type="text"
                className={styles.formInput}
                value={newExamData.id}
                onChange={(e) => setNewExamData({...newExamData, id: e.target.value})}
                placeholder="例如：math_basic"
                required
              />
              <p className={styles.formHelper}>只能包含小写字母、数字、下划线和连字符</p>
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="exam-name" className={styles.formLabel}>试卷名称</label>
              <input
                id="exam-name"
                type="text"
                className={styles.formInput}
                value={newExamData.name}
                onChange={(e) => setNewExamData({...newExamData, name: e.target.value})}
                placeholder="例如：基础数学考试"
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="exam-description" className={styles.formLabel}>试卷描述（可选）</label>
              <textarea
                id="exam-description"
                className={styles.formTextarea}
                value={newExamData.description}
                onChange={(e) => setNewExamData({...newExamData, description: e.target.value})}
                placeholder="描述这个试卷的内容和用途"
                rows={3}
              />
            </div>
            <div className={styles.formActions}>
              <button 
                type="submit" 
                className={styles.submitButton}
                disabled={isLoading}
              >
                {isLoading ? '创建中...' : '创建试卷'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 试卷列表 */}
      <div className={styles.examList}>
        <h2 className={styles.sectionTitle}>现有试卷</h2>
        {isLoading && !showCreateForm ? (
          <div className={styles.loading}>加载中...</div>
        ) : examTypes.length === 0 ? (
          <div className={styles.emptyState}>暂无试卷，请创建新试卷</div>
        ) : (
          <table className={styles.examTable}>
            <thead>
              <tr>
                <th>ID</th>
                <th>名称</th>
                <th>描述</th>
                <th>题目数量</th>
                <th>最后修改</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {examTypes.map((exam) => (
                <tr key={exam.id} className={styles.examRow}>
                  <td>{exam.id}</td>
                  <td>{exam.name}</td>
                  <td>{exam.description || '-'}</td>
                  <td>{exam.questionCount}</td>
                  <td>{new Date(exam.lastModified).toLocaleString()}</td>
                  <td className={styles.actions}>
                    <button
                      className={styles.editButton}
                      onClick={() => onExamCreated(exam.id)}
                    >
                      编辑
                    </button>
                    <Link 
                      href={`/testField/experiment?type=${exam.id}`}
                      className={styles.testButton}
                    >
                      进入测试
                    </Link>
                    <button
                      className={styles.deleteButton}
                      onClick={() => handleDeleteExam(exam.id)}
                      disabled={exam.id === 'default' || exam.id === 'arknights'}
                    >
                      删除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
} 
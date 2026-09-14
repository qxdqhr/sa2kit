'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import styles from '../config/styles';
import { ConfigData } from '../config/types';
import QuestionConfig from '../config/components/QuestionConfig';
import StartScreenConfig from '../config/components/StartScreenConfig';
import ResultsConfig from '../config/components/ResultsConfig';
import ExamManagement from '../config/components/ExamManagement';
import { loadConfigurations, saveConfigurations, 
  exportConfigurations, importConfigurations } from '../config/services/configManagement';
import { BackButton } from 'sa2kit/common/ui/patterns/next';
import { Question, StartScreenData, ResultModalData } from '../config/types';

// 修改部分：用空数组初始化，然后动态加载
const DEFAULT_EXAM_TYPE_OPTIONS = [
  { value: 'default', label: '通用考试' },
  { value: 'arknights', label: '明日方舟测试' },
];

// 导航选项
type NavigationTab = 'config' | 'management';

function ConfigContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const examType = searchParams?.get('type') || 'default';
  
  // 导航状态
  const [navTab, setNavTab] = useState<NavigationTab>('config');
  const [activeTab, setActiveTab] = useState('questions');
  const [config, setConfig] = useState<ConfigData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [saveMessage, setSaveMessage] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  // 添加试卷类型选项状态
  const [examTypeOptions, setExamTypeOptions] = useState<{ value: string; label: string; }[]>(DEFAULT_EXAM_TYPE_OPTIONS);
  // 添加试卷类型映射表状态
  const [examTypeMap, setExamTypeMap] = useState<Record<string, string>>({});

  // 加载试卷类型选项和映射表
  useEffect(() => {
    const loadExamTypeData = async () => {
      try {
        const response = await fetch('/api/testField/experiment/config/examTypes?details=true');
        if (response.ok) {
          const examDetails = await response.json();
          // 处理选项
          const options = examDetails.map((exam: any) => ({
            value: exam.id,
            label: exam.name
          }));
          setExamTypeOptions(options);
          
          // 构建映射表：id -> id (保持一致性)
          const mapping: Record<string, string> = {};
          examDetails.forEach((exam: any) => {
            mapping[exam.id] = exam.id;
          });
          setExamTypeMap(mapping);
        } else {
          console.error('加载试卷类型数据失败:', response.statusText);
        }
      } catch (error) {
        console.error('加载试卷类型数据失败:', error);
      }
    };

    loadExamTypeData();
  }, []);

  // 切换试卷类型
  const handleTypeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = event.target.value;
    router.push(`/testField/experiment/config/?type=${newType}`);
  };

  // 加载配置
  useEffect(() => {
    const loadConfig = async () => {
      setIsLoading(true);
      setSaveMessage('');
      setSaveStatus('idle');
      
      try {
        // 首先检查该试卷类型是否存在于当前可用的试卷列表中
        const isExamTypeValid = examTypeOptions.some(option => option.value === examType);
        
        // 如果试卷类型无效且不是默认试卷，则重定向到默认试卷
        if (!isExamTypeValid && examType !== 'default') {
          console.warn(`试卷类型 "${examType}" 不存在，重定向到默认试卷`);
          router.push('/testField/experiment/config/?type=default');
          return;
        }
        
        // 使用examType获取对应的试卷配置
        const examId = examTypeMap[examType] || examType || 'default';
        const data = await loadConfigurations(examId);
        setConfig(data);
        setSaveMessage(`已加载 ${examTypeOptions.find(opt => opt.value === examType)?.label || examType} 配置`);
        setSaveStatus('success');
        setTimeout(() => {
          setSaveMessage('');
          setSaveStatus('idle');
        }, 3000);
      } catch (error) {
        console.error('加载配置失败:', error);
        setSaveMessage(`加载 ${examType} 配置失败`);
        setSaveStatus('error');
      } finally {
        setIsLoading(false);
      }
    };

    if (navTab === 'config' && Object.keys(examTypeMap).length > 0) {
      loadConfig();
    }
  }, [examType, navTab, examTypeOptions, examTypeMap, router]);

  // 保存配置
  const handleSave = async () => {
    if (!config) return;

    setSaveStatus('saving');
    setSaveMessage('正在保存...');

    try {
      // 替换 EXAM_TYPE_MAP 为动态获取的 examTypeMap
      const examId = examTypeMap[examType] || examType || 'default';
      await saveConfigurations(config, examId);
      setSaveMessage(`${examTypeOptions.find(opt => opt.value === examType)?.label || examType} 配置已保存`);
      setSaveStatus('success');
      setTimeout(() => {
        setSaveMessage('');
        setSaveStatus('idle');
      }, 3000);
    } catch (error) {
      console.error('保存配置失败:', error);
      setSaveMessage('保存失败，请重试');
      setSaveStatus('error');
      setTimeout(() => {
        setSaveMessage('');
        setSaveStatus('idle');
      }, 5000);
    }
  };

  // 导出配置
  const handleExport = () => {
    if (!config) return;
    // 替换 EXAM_TYPE_MAP 为动态获取的 examTypeMap
    const examId = examTypeMap[examType] || examType || 'default';
    exportConfigurations(config, examId);
  };

  // 导入配置
  const handleImport = () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    fileInput.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          // 替换 EXAM_TYPE_MAP 为动态获取的 examTypeMap
          const examId = examTypeMap[examType] || examType || 'default';
          const data = await importConfigurations(file, examId);
          setConfig(data);
          setSaveMessage(`配置已导入到 ${examTypeOptions.find(opt => opt.value === examType)?.label || examType}`);
          setSaveStatus('success');
          setTimeout(() => {
            setSaveMessage('');
            setSaveStatus('idle');
          }, 3000);
        } catch (error) {
          console.error('导入配置失败:', error);
          setSaveMessage('导入失败');
          setSaveStatus('error');
        }
      }
    };
    fileInput.click();
  };

  // 更新问题配置
  const handleQuestionsChange = (questions: Question[]) => {
    if (!config) return;
    setConfig({
      ...config,
      questions
    });
  };

  // 更新启动页配置
  const handleStartScreenChange = (startScreen: StartScreenData) => {
    if (!config) return;
    setConfig({
      ...config,
      startScreen
    });
  };

  // 更新结果页配置
  const handleResultModalChange = (resultModal: ResultModalData) => {
    if (!config) return;
    setConfig({
      ...config,
      resultModal
    });
  };

  // 试卷创建成功后的回调
  const handleExamCreated = (type: string) => {
    // 重新加载试卷类型选项
    fetch('/api/testField/experiment/config/examTypes?details=true')
      .then(response => response.json())
      .then(examDetails => {
        const options = examDetails.map((exam: any) => ({
          value: exam.id,
          label: exam.name
        }));
        setExamTypeOptions(options);
        
        // 更新映射表
        const mapping: Record<string, string> = {};
        examDetails.forEach((exam: any) => {
          mapping[exam.id] = exam.id;
        });
        setExamTypeMap(mapping);
        
        router.push(`/testField/experiment/config/?type=${type}`);
        setNavTab('config');
      })
      .catch(error => {
        console.error('刷新试卷类型选项失败:', error);
        router.push(`/testField/experiment/config/?type=${type}`);
        setNavTab('config');
      });
  };

  if (isLoading && navTab === 'config') {
    return <div className={styles.configContainer}>加载中...</div>;
  }

  if (!config && navTab === 'config') {
    return <div className={styles.configContainer}>无法加载配置数据</div>;
  }

  return (
    <div className={styles.configContainer}>
      <BackButton href="/testField" />
      
      <div className={styles.mainContainer}>
        {/* 左侧导航栏 */}
        <div className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <h2 className={styles.sidebarTitle}>系统管理</h2>
          </div>
          <div className={styles.sidebarMenu}>
            <button 
              className={`${styles.sidebarMenuItem} ${navTab === 'config' ? styles.active : ''}`}
              onClick={() => setNavTab('config')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className={styles.sidebarIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              试卷配置
            </button>
            <button 
              className={`${styles.sidebarMenuItem} ${navTab === 'management' ? styles.active : ''}`}
              onClick={() => setNavTab('management')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className={styles.sidebarIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              试卷管理
            </button>
          </div>
        </div>
        
        {/* 主内容区域 */}
        <div className={styles.contentArea}>
          {navTab === 'config' && config && (
            <>
              <div className={styles.header}>
                <div className={styles.titleContainer}>
                  <h1 className={styles.title}>考试系统配置</h1>
                  <div className={styles.typeSelector}>
                    <label htmlFor="examType" className={styles.typeLabel}>试卷类型:</label>
                    <select
                      id="examType"
                      className={styles.typeSelect}
                      value={examType}
                      onChange={handleTypeChange}
                    >
                      {examTypeOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className={styles.actions}>
                  <button
                    className={`${styles.saveButton} ${saveStatus === 'saving' ? styles.saving : ''}`}
                    onClick={handleSave}
                    disabled={saveStatus === 'saving'}
                  >
                    {saveStatus === 'saving' ? '保存中...' : '保存配置'}
                  </button>
                  <button
                    className={styles.saveButton}
                    onClick={handleExport}
                    style={{ marginLeft: '8px' }}
                  >
                    导出配置
                  </button>
                  <button
                    className={styles.saveButton}
                    onClick={handleImport}
                    style={{ marginLeft: '8px' }}
                  >
                    导入配置
                  </button>
                  {saveMessage && (
                    <span className={`${styles.saveMessage} ${
                      saveStatus === 'error' ? styles.errorMessage : 
                      saveStatus === 'success' ? styles.successMessage : ''
                    }`}>
                      {saveMessage}
                    </span>
                  )}
                </div>
              </div>

              <div className={styles.tabs}>
                <div className={styles.tabsList}>
                  <button
                    className={`${styles.tabsTrigger} ${activeTab === 'questions' ? styles.active : ''}`}
                    onClick={() => setActiveTab('questions')}
                    data-state={activeTab === 'questions' ? 'active' : ''}
                  >
                    试题配置
                  </button>
                  <button
                    className={`${styles.tabsTrigger} ${activeTab === 'startScreen' ? styles.active : ''}`}
                    onClick={() => setActiveTab('startScreen')}
                    data-state={activeTab === 'startScreen' ? 'active' : ''}
                  >
                    启动页配置
                  </button>
                  <button
                    className={`${styles.tabsTrigger} ${activeTab === 'results' ? styles.active : ''}`}
                    onClick={() => setActiveTab('results')}
                    data-state={activeTab === 'results' ? 'active' : ''}
                  >
                    结果页配置
                  </button>
                </div>

                <div className={styles.tabsContent}>
                  {activeTab === 'questions' && (
                    <QuestionConfig
                      questions={config.questions}
                      onQuestionsChange={handleQuestionsChange}
                    />
                  )}
                  
                  {activeTab === 'startScreen' && (
                    <StartScreenConfig
                      startScreenData={config.startScreen}
                      onStartScreenChange={handleStartScreenChange}
                    />
                  )}
                  
                  {activeTab === 'results' && (
                    <ResultsConfig
                      resultModalData={config.resultModal}
                      onResultModalChange={handleResultModalChange}
                    />
                  )}
                </div>
              </div>
            </>
          )}
          
          {navTab === 'management' && (
            <ExamManagement 
              onExamCreated={handleExamCreated}
              examTypeOptions={examTypeOptions}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default function ExamConfigPage() {
  return (
    <Suspense fallback={<div>加载中...</div>}>
      <ConfigContent />
    </Suspense>
  );
}
import { ConfigData } from '../types';
import {
  mockQuestions,
  mockStartScreenData,
  mockResultModalData,
} from '../../utils/mockData';
import { ExamConfigFrontendService, HttpExamClient } from '../../../../domain';
import type { ExamConfig } from '../../../../domain';

const examConfigService = new ExamConfigFrontendService(new HttpExamClient());

export const listExamTypes = async (): Promise<string[]> => {
  try {
    return await examConfigService.listTypes();
  } catch (error) {
    console.error('加载试卷类型列表失败:', error);
    return ['default'];
  }
};

export const loadConfigurations = async (examId: string = 'default'): Promise<ConfigData> => {
  try {
    return (await examConfigService.load(examId)) as unknown as ConfigData;
  } catch (error) {
    console.error('加载配置失败:', error);

    return {
      questions: mockQuestions,
      startScreen: mockStartScreenData,
      resultModal: mockResultModalData,
    };
  }
};

export const saveConfigurations = async (
  config: ConfigData,
  examId: string = 'default',
): Promise<void> => {
  try {
    await examConfigService.save(examId, config as unknown as ExamConfig);
  } catch (error) {
    console.error('保存配置失败:', error);
    throw error;
  }
};

export const exportConfigurations = (config: ConfigData, examId: string = 'default'): void => {
  try {
    const dataStr = JSON.stringify(config, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;

    const titlePart = config.startScreen?.title
      ? config.startScreen.title.replace(/\s+/g, '_').slice(0, 20)
      : '';
    const exportFileName = `exam_${examId}_${titlePart}_${new Date().toISOString().slice(0, 10)}.json`;

    if (typeof document !== 'undefined' && document.body) {
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileName);

      try {
        document.body.appendChild(linkElement);
        linkElement.click();

        if (linkElement.parentNode === document.body) {
          document.body.removeChild(linkElement);
        }
      } catch (domError) {
        console.warn('DOM操作警告:', domError);
        linkElement.click();
      }
    } else {
      console.error('无法导出文件：document或document.body不可用');
    }
  } catch (error) {
    console.error('导出配置失败:', error);
  }
};

export const importConfigurations = async (
  file: File,
  examId: string = 'default',
): Promise<ConfigData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const config = JSON.parse(event.target?.result as string);
        await saveConfigurations(config, examId);
        resolve(config);
      } catch (error) {
        reject(new Error('配置文件格式无效'));
      }
    };

    reader.onerror = () => {
      reject(new Error('读取文件失败'));
    };

    reader.readAsText(file);
  });
};

export const saveAsStaticFile = async (config: ConfigData): Promise<void> => {
  try {
    const response = await fetch('/api/testField/experiment/config/questions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
    });

    if (!response.ok) {
      throw new Error('保存配置文件失败');
    }
  } catch (error) {
    console.error('保存静态文件失败:', error);
    throw error;
  }
};

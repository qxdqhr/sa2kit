import { loadConfigurations, saveConfigurations } from './configManagement';
import { ConfigData } from '../types';

/**
 * 获取所有试卷类型ID列表
 */
export const getAllExamTypes = async (): Promise<string[]> => {
  try {
    // 从API获取所有试卷类型
    const response = await fetch('/api/testField/experiment/config/examTypes');
    
    if (!response.ok) {
      throw new Error(`获取试卷类型失败: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('获取试卷类型列表失败:', error);
    // 返回默认的试卷类型
    return ['default', 'arknights'];
  }
};

/**
 * 创建新的试卷类型
 * @param id 试卷类型ID
 * @param name 试卷类型名称
 * @param description 试卷类型描述
 */
export const createExamType = async (
  id: string,
  name: string,
  description: string = ''
): Promise<void> => {
  try {
    // 检查ID是否合法
    if (!/^[a-z0-9_-]+$/.test(id)) {
      throw new Error('试卷ID格式不正确');
    }

    // 调用API创建新试卷
    const response = await fetch('/api/testField/experiment/config/examTypes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id, name, description }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || `创建试卷失败: ${response.statusText}`);
    }

    // 创建基本配置
    // 使用默认试卷作为模板
    const defaultConfig = await loadConfigurations('default');
    
    // 保存新的配置
    await saveConfigurations(defaultConfig, id);

    return;
  } catch (error) {
    console.error('创建试卷类型失败:', error);
    throw error;
  }
};

/**
 * 删除试卷类型
 * @param id 试卷类型ID
 */
export const deleteExamType = async (id: string): Promise<void> => {
  try {
    // 不允许删除系统默认试卷
    if (id === 'default' || id === 'arknights') {
      throw new Error('不能删除系统默认试卷');
    }

    // 调用API删除试卷
    const response = await fetch(`/api/testField/experiment/config/examTypes?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || `删除试卷失败: ${response.statusText}`);
    }

    return;
  } catch (error) {
    console.error('删除试卷类型失败:', error);
    throw error;
  }
};

/**
 * 获取试卷类型详细信息
 * @param id 试卷类型ID
 */
export const getExamTypeDetails = async (id: string): Promise<{
  id: string;
  name: string;
  description: string;
  createdAt: string;
  lastModified: string;
  questionCount: number;
}> => {
  try {
    // 从API获取详细信息
    const response = await fetch('/api/testField/experiment/config/examTypes?details=true');
    
    if (!response.ok) {
      throw new Error(`获取试卷详情失败: ${response.statusText}`);
    }
    
    const examTypes = await response.json();
    const examDetail = examTypes.find((exam: any) => exam.id === id);
    
    if (examDetail) {
      return examDetail;
    }
    
    // 如果找不到指定试卷，返回默认数据
    return {
      id,
      name: id,
      description: '',
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      questionCount: 0,
    };
  } catch (error) {
    console.error(`获取试卷 ${id} 详情失败:`, error);
    // 返回默认数据
    return {
      id,
      name: id,
      description: '',
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      questionCount: 0,
    };
  }
}; 
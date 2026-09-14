import { useState } from 'react';
import { WorkItem } from '../../../domain';

export const useWorkItemManagement = () => {
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [newWork, setNewWork] = useState({ title: '', manDays: 0 });
  const [editingWork, setEditingWork] = useState<WorkItem | null>(null);

  const handleAddWork = () => {
    if (newWork.title && newWork.manDays > 0) {
      if (editingWork) {
        setWorkItems(workItems.map(item => 
          item.id === editingWork.id 
            ? { ...item, title: newWork.title, manDays: newWork.manDays }
            : item
        ));
        setEditingWork(null);
      } else {
        setWorkItems([
          ...workItems,
          {
            id: `work-${Date.now()}`,
            title: newWork.title,
            manDays: newWork.manDays,
          },
        ]);
      }
      setNewWork({ title: '', manDays: 0 });
    }
  };

  const handleEditWork = (workId: string) => {
    const workItem = workItems.find(item => item.id === workId);
    if (workItem) {
      setEditingWork(workItem);
      setNewWork({ title: workItem.title, manDays: workItem.manDays });
    }
  };

  const handleDeleteWork = (workId: string) => {
    if (confirm('确定要删除这个工作吗？')) {
      setWorkItems(workItems.filter(item => item.id !== workId));
    }
  };

  return {
    workItems,
    setWorkItems,
    newWork,
    setNewWork,
    editingWork,
    handleAddWork,
    handleEditWork,
    handleDeleteWork,
  };
};

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Assignment, WorkItem } from '../../../domain';
import { Dayjs } from 'dayjs';

interface UseDragAndDropProps {
  startDate: Dayjs;
  endDate: Dayjs;
  workItems: WorkItem[];
  setWorkItems: (items: WorkItem[]) => void;
  assignments: Assignment[];
  setAssignments: (assignments: Assignment[]) => void;
}

export const useDragAndDrop = ({
  startDate,
  endDate,
  workItems,
  setWorkItems,
  assignments,
  setAssignments,
}: UseDragAndDropProps) => {
  const [draggedAssignment, setDraggedAssignment] = useState<Assignment | null>(null);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, personIndex: number, dayIndex: number) => {
    e.preventDefault();
    const workId = e.dataTransfer.getData('text/plain');
    let workItem: WorkItem | undefined;

    if (draggedAssignment) {
      workItem = draggedAssignment.work;
      if (draggedAssignment.personIndex === personIndex && draggedAssignment.startDay === dayIndex) {
        setDraggedAssignment(null);
        return;
      }
      setAssignments(assignments.filter(a => a.workId !== workItem!.id));
    } else {
      workItem = workItems.find(w => w.id === workId);
      if (!workItem) return;
    }

    const endDayIndex = dayIndex + workItem.manDays - 1;
    const totalDays = endDate.diff(startDate, 'day') + 1;
    
    if (endDayIndex >= totalDays) {
      toast.error('工作超出计划时间范围，请调整工期或选择其他时间');
      if (draggedAssignment) {
        setAssignments([...assignments, draggedAssignment]);
      }
      setDraggedAssignment(null);
      return;
    }

    const hasSpace = Array.from({ length: workItem.manDays }).every((_, i) => {
      const day = dayIndex + i;
      return !assignments.some(a => 
        a.workId !== workItem!.id &&
        a.personIndex === personIndex &&
        ((day >= a.startDay && day < a.startDay + a.work.manDays) ||
         (a.startDay >= day && a.startDay < day + workItem!.manDays))
      );
    });

    if (!hasSpace) {
      toast.error('所选时间段已有其他工作安排');
      if (draggedAssignment) {
        setAssignments([...assignments, draggedAssignment]);
      } else {
        setWorkItems([...workItems]);
      }
      setDraggedAssignment(null);
      return;
    }

    if (!draggedAssignment) {
      setWorkItems(workItems.filter(w => w.id !== workId));
    }
    
    setAssignments([
      ...assignments.filter(a => a.workId !== workItem!.id),
      {
        workId: workItem.id,
        personIndex,
        startDay: dayIndex,
        work: workItem,
      },
    ]);

    setDraggedAssignment(null);
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, assignment?: Assignment) => {
    if (assignment) {
      e.dataTransfer.setData('text/plain', assignment.workId);
      setDraggedAssignment(assignment);
    } else {
      const workId = e.currentTarget.getAttribute('data-work-id');
      if (workId) {
        e.dataTransfer.setData('text/plain', workId);
      }
    }
  };

  const handleWorkListDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!draggedAssignment) return;

    setWorkItems([...workItems, draggedAssignment.work]);
    setAssignments(assignments.filter(a => a.workId !== draggedAssignment.workId));
    setDraggedAssignment(null);
  };

  return {
    draggedAssignment,
    handleDrop,
    handleDragStart,
    handleWorkListDrop,
  };
};
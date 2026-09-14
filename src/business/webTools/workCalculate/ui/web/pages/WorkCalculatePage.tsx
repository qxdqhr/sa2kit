'use client';

import { useState } from 'react';
import { BackButton } from 'sa2kit/common/ui/patterns';
import dayjs, { Dayjs } from 'dayjs';
import { Assignment } from '../../../domain';
import { DateControls } from '../components/DateControls';
import { WorkInput } from '../components/WorkInput';
import { WorkList } from '../components/WorkList';
import { Timeline } from '../components/Timeline';
import { ToolControls } from '../components/ToolControls';
import { Toaster } from 'react-hot-toast';
import '../styles.css';
import { useWorkItemManagement } from '../hooks/useWorkItemManagement';
import { usePeopleManagement } from '../hooks/usePeopleManagement';
import { useDragAndDrop } from '../hooks/useDragAndDrop';

export type WorkCalculatePageProps = {
  /** 返回链接，默认 /testField */
  backHref?: string;
};

export default function WorkCalculatePage({ backHref = '/testField' }: WorkCalculatePageProps) {
  const [startDate, setStartDate] = useState<Dayjs>(dayjs());
  const [endDate, setEndDate] = useState<Dayjs>(dayjs().add(7, 'day'));
  const [isHighLightWeekend, setIsHighLightWeekend] = useState(false);
  const [isShowHolidays, setIsShowHolidays] = useState(true);
  const [assignments, setAssignments] = useState<Assignment[]>([]);

  const {
    workItems,
    setWorkItems,
    newWork,
    setNewWork,
    editingWork,
    handleAddWork,
    handleEditWork,
    handleDeleteWork,
  } = useWorkItemManagement();

  const {
    numberOfPeople,
    people,
    setPeople,
    handleNumberOfPeopleChange,
    handlePersonNameChange,
    handlePersonHolidayChange,
  } = usePeopleManagement();

  const {
    handleDrop,
    handleDragStart,
    handleWorkListDrop,
  } = useDragAndDrop({
    startDate,
    endDate,
    workItems,
    setWorkItems,
    assignments,
    setAssignments,
  });

  return (
    <div className="container">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#fff',
            color: '#333',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            borderRadius: '8px',
            padding: '12px 20px',
          },
          success: {
            style: {
              border: '1px solid #86efac',
              background: '#f0fdf4',
            },
          },
          error: {
            style: {
              border: '1px solid #fca5a5',
              background: '#fef2f2',
            },
          },
        }}
      />
      <BackButton href={backHref} />
      <h1>工作分配计划</h1>

      <div className="section-card">
        <h2>📅 工作日程范围</h2>
        <DateControls
          startDate={startDate}
          endDate={endDate}
          numberOfPeople={numberOfPeople}
          people={people}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          onNumberOfPeopleChange={handleNumberOfPeopleChange}
          onPersonNameChange={handlePersonNameChange}
          onPersonHolidayChange={handlePersonHolidayChange}
        />
      </div>

      <div className="section-card">
        <h2>✏️ 添加工作</h2>
        <WorkInput
          title={newWork.title}
          manDays={newWork.manDays}
          onTitleChange={(title: string) => setNewWork({ ...newWork, title })}
          onManDaysChange={(manDays: number) => setNewWork({ ...newWork, manDays })}
          onAdd={handleAddWork}
          isEditing={!!editingWork}
        />
      </div>

      <div className="section-card">
        <h2>🛠 工具设置</h2>
        <ToolControls
          isHighLightWeekend={isHighLightWeekend}
          isShowHolidays={isShowHolidays}
          onHighLightWeekendChange={setIsHighLightWeekend}
          onShowHolidaysChange={setIsShowHolidays}
        />
      </div>

      <div className="section-card">
        <h2>📋 工作分配</h2>
        <div className="work-area">
          <WorkList
            workItems={workItems}
            onDragStart={handleDragStart}
            onDrop={handleWorkListDrop}
            onEdit={handleEditWork}
            onDelete={handleDeleteWork}
          />

          <Timeline
            startDate={startDate}
            endDate={endDate}
            people={people}
            assignments={assignments}
            isHighLightWeekend={isHighLightWeekend}
            isShowHolidays={isShowHolidays}
            onDragStart={handleDragStart}
            onDrop={handleDrop}
            onPersonNameChange={handlePersonNameChange}
          />
        </div>
      </div>
    </div>
  );
}

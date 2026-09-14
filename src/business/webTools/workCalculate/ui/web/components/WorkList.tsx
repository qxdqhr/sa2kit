import { WorkItem } from '../../../domain';

interface WorkListProps {
  workItems: WorkItem[];
  onDragStart: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  onEdit: (workId: string) => void;
  onDelete: (workId: string) => void;
}

export function WorkList({ workItems, onDragStart, onDrop, onEdit, onDelete }: WorkListProps) {
  return (
    <div 
      className="work-list"
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
    >
      <h2>待分配工作</h2>
      {workItems.map((work) => (
        <div
          key={work.id}
          data-work-id={work.id}
          className="work-item"
          draggable
          onDragStart={onDragStart}
        >
          <div className="work-content">
            <div className="work-title">{work.title}</div>
            <div className="work-days">人天: {work.manDays}</div>
          </div>
          <div className="work-actions">
            <button 
              className="action-button edit"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(work.id);
              }}
            >
              ✏️
            </button>
            <button 
              className="action-button delete"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(work.id);
              }}
            >
              🗑️
            </button>
          </div>
        </div>
      ))}
    </div>
  );
} 
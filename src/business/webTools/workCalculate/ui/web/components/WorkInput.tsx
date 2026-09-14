interface WorkInputProps {
    title: string;
    manDays: number;
    isEditing?: boolean;
    onTitleChange: (title: string) => void;
    onManDaysChange: (days: number) => void;
    onAdd: () => void;
}
  
export function WorkInput({
    title,
    manDays,
    isEditing = false,
    onTitleChange,
    onManDaysChange,
    onAdd,
}: WorkInputProps) {
    return (
        <div className="work-input">
            <div className="input-group">
                <input
                    placeholder="工作名称"
                    value={title}
                    onChange={(e) => onTitleChange(e.target.value)}
                    className="text-input"
                />
                <input
                    type="number"
                    placeholder="所需人天"
                    value={manDays}
                    onChange={(e) => onManDaysChange(parseInt(e.target.value) || 0)}
                    className="number-input"
                />
                <button onClick={onAdd} className="add-button">
                    {isEditing ? '保存修改' : '添加工作'}
                </button>
            </div>
        </div>
    );
}
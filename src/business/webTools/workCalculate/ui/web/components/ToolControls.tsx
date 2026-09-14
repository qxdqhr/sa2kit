import { useState } from "react";

interface ToolControlsProps {
    isHighLightWeekend: boolean;
    isShowHolidays: boolean;
    onHighLightWeekendChange: (value: boolean) => void;
    onShowHolidaysChange: (value: boolean) => void;
}

export function ToolControls({ 
    isHighLightWeekend, 
    isShowHolidays,
    onHighLightWeekendChange,
    onShowHolidaysChange,
}: ToolControlsProps) {
    return (
        <div className="tool-controls">
            <label className="checkbox-label">
                <input
                    type="checkbox"
                    checked={isHighLightWeekend}
                    onChange={(e) => onHighLightWeekendChange(e.target.checked)}
                />
                高亮周末
            </label>
            <label className="checkbox-label">
                <input
                    type="checkbox"
                    checked={isShowHolidays}
                    onChange={(e) => onShowHolidaysChange(e.target.checked)}
                />
                显示假期
            </label>
        </div>
    )
}
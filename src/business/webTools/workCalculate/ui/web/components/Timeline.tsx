import { Dayjs } from 'dayjs';
import { Assignment, WorkItem, Person, Holiday } from '../../../domain';
import { useHolidayColors } from '../hooks/useHolidayColors';

interface TimelineProps {
  startDate: Dayjs;
  endDate: Dayjs;
  people: Person[];
  assignments: Assignment[];
  isHighLightWeekend: boolean;
  isShowHolidays: boolean;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, assignment?: Assignment) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>, personIndex: number, dayIndex: number) => void;
  onPersonNameChange: (personId: number, newName: string) => void;
}

export function Timeline({
  startDate,
  endDate,
  people,
  assignments,
  isHighLightWeekend,
  isShowHolidays,
  onDragStart,
  onDrop,
  onPersonNameChange,
}: TimelineProps) {
  const { getHolidayStyles } = useHolidayColors();

  const getHolidayForDate = (person: Person, date: string): Holiday | undefined => {
    return person.holidays.find(h => h.date === date);
  };

  const getDayCellClassName = (date: Dayjs, personIndex: number, isAssigned: boolean) => {
    const classes = ['day-cell'];
    const dateStr = date.format('YYYY-MM-DD');
    const person = people[personIndex];
    const holiday = person && getHolidayForDate(person, dateStr);

    if (isHighLightWeekend && (date.day() === 0 || date.day() === 6)) {
      classes.push('weekend');
    }
    
    if (isAssigned) {
      classes.push('assigned');
    }

    if (holiday) {
      classes.push('holiday');
      classes.push(`holiday-${holiday.type}`);
    }

    return classes.join(' ');
  };

  const getCellStyle = (holiday?: Holiday, isAssigned?: boolean) => {
    if (!holiday) return {};
    const styles = getHolidayStyles(holiday.type);
    return isAssigned ? styles.cellAssigned : styles.cell;
  };

  return (
    <div className="timeline">
      {people.map((person, personIndex) => (
        <div key={person.id} className="timeline-row">
          <div className="person-name">
            <input
              type="text"
              value={person.name}
              onChange={(e) => onPersonNameChange(person.id, e.target.value)}
              className="person-name-input"
              placeholder={`人员 ${person.id + 1}`}
            />
          </div>
          <div className="day-cells">
            {Array.from({ length: endDate.diff(startDate, 'day') + 1 }).map((_, dayIndex) => {
              const currentDate = startDate.add(dayIndex, 'day');
              const dateStr = currentDate.format('YYYY-MM-DD');
              const assignment = assignments.find(
                a => a.personIndex === personIndex && a.startDay === dayIndex
              );
              const holiday = getHolidayForDate(person, dateStr);

              return (
                <div
                  key={dayIndex}
                  className={getDayCellClassName(currentDate, personIndex, !!assignment)}
                  style={getCellStyle(holiday, !!assignment)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => onDrop(e, personIndex, dayIndex)}
                >
                  <div className="date-label">
                    <div>{currentDate.format('MM/DD')}</div>
                    <div className="weekday">{currentDate.format('ddd')}</div>
                  </div>
                  {assignment && (
                    <div
                      className="assignment"
                      draggable
                      onDragStart={(e) => onDragStart(e, assignment)}
                    >
                      <div className="assignment-title">{assignment.work.title}</div>
                      <div className="assignment-days">{assignment.work.manDays}天</div>
                    </div>
                  )}
                  {isShowHolidays && holiday && !assignment && (
                    <div 
                      className="holiday-indicator"
                      style={getHolidayStyles(holiday.type).indicator}
                    >
                      <span className="holiday-indicator-name" title={holiday.name}>
                        {holiday.name}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
} 
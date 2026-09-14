import dayjs, { Dayjs } from 'dayjs';
import { Person, Holiday, HolidayType } from '../../../domain';
import { useHolidayColors } from '../hooks/useHolidayColors';

interface DateControlsProps {
  startDate: Dayjs;
  endDate: Dayjs;
  numberOfPeople: number;
  people: Person[];
  onStartDateChange: (date: Dayjs) => void;
  onEndDateChange: (date: Dayjs) => void;
  onNumberOfPeopleChange: (num: number) => void;
  onPersonNameChange: (personId: number, newName: string) => void;
  onPersonHolidayChange: (
    personId: number,
    date: string,
    isDelete: boolean,
    isCreate: boolean,
    isUpdate: boolean,
    name?: string,
    type?: HolidayType
  ) => void;
}

export function DateControls({
  startDate,
  endDate,
  numberOfPeople,
  people,
  onStartDateChange,
  onEndDateChange,
  onNumberOfPeopleChange,
  onPersonNameChange,
  onPersonHolidayChange,
}: DateControlsProps) {
  const { getHolidayStyles } = useHolidayColors();

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = dayjs(e.target.value);
    if (newDate.isValid()) {
      if (newDate.isAfter(endDate)) {
        // 如果开始日期晚于结束日期，将结束日期设置为开始日期后7天
        onStartDateChange(newDate);
        onEndDateChange(newDate.add(7, 'day'));
      } else {
        onStartDateChange(newDate);
      }
    }
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = dayjs(e.target.value);
    if (newDate.isValid()) {
      if (newDate.isBefore(startDate)) {
        // 如果结束日期早于开始日期，将开始日期设置为结束日期前7天
        onEndDateChange(newDate);
        onStartDateChange(newDate.subtract(7, 'day'));
      } else {
        onEndDateChange(newDate);
      }
    }
  };

  const handleHolidayAdd = (personId: number, date: string) => {
    if (!date) return;
    const person = people.find(p => p.id === personId);
    const hasHoliday = person?.holidays.some(h => h.date === date);
    if (!hasHoliday) {
      onPersonHolidayChange(
        personId,
        date,
        true,  // isDelete
        true,  // isCreate
        false, // isUpdate
        HolidayType.showName(HolidayType.Work),
        HolidayType.Work
      );
    }
  };

  const handleHolidayNameChange = (personId: number, date: string, newName: string, type?: HolidayType) => {
    const person = people.find(p => p.id === personId);
    if (person) {
      const holiday = person.holidays.find(h => h.date === date);
      if (holiday) {
        onPersonHolidayChange(
          personId,
          date,
          true,   // isDelete
          false,  // isCreate
          true,   // isUpdate
          newName,
          type || holiday.type
        );
      }
    }
  };

  const handleHolidayTypeChange = (personId: number, date: string, type: HolidayType) => {
    const person = people.find(p => p.id === personId);
    if (person) {
      const holiday = person.holidays.find(h => h.date === date);
      if (holiday) {
        onPersonHolidayChange(
          personId,
          date,
          true,   // isDelete
          false,  // isCreate
          true,   // isUpdate
          holiday.name,
          type
        );
      }
    }
  };

  const handleHolidayEnable = (person: Person) => {
    onPersonHolidayChange(
      person.id,
      dayjs().format('YYYY-MM-DD'),
      true,   // isDelete
      true,   // isCreate
      false,  // isUpdate
      HolidayType.showName(HolidayType.Work),
      HolidayType.Work
    );
  };

  return (
    <div>
      <div className="controls">
        <h4>开始日期</h4>
        <input
          type="date"
          value={startDate.format('YYYY-MM-DD')}
          onChange={handleStartDateChange}
          className="date-input"
        />
        <h4>结束日期</h4>
        <input
          type="date"
          value={endDate.format('YYYY-MM-DD')}
          onChange={handleEndDateChange}
          className="date-input"
        />
        <input
          type="number"
          placeholder="可用人数"
          value={numberOfPeople}
          onChange={(e) => onNumberOfPeopleChange(parseInt(e.target.value) || 1)}
          className="number-input"
          min="1"
        />
      </div>

      <div className="people-list">
        <h3>当前人员列表</h3>
        <div className="people-grid">
          {people.map((person) => (
            <div key={person.id} className="person-card">
              <div className="person-info">
                <div className="person-header">
                  <input
                    type="text"
                    value={person.name}
                    onChange={(e) => onPersonNameChange(person.id, e.target.value)}
                    className="person-name-input"
                    placeholder={`人员 ${person.id + 1}`}
                  />
                  <button
                    onClick={() => handleHolidayEnable(person)}
                    className="add-holiday-btn"
                    title="添加假期"
                  >
                    添加假期
                  </button>
                </div>

                {person.holidays.length > 0 && (
                  <div className="holiday-picker">
                    <div className="holiday-dates">
                      {person.holidays.map((holiday) => {
                        const styles = getHolidayStyles(holiday.type);
                        return (
                          <div
                            key={holiday.date}
                            className="holiday-tag"
                            style={styles.tag}
                          >
                            <select
                              value={holiday.type}
                              onChange={(e) => handleHolidayTypeChange(person.id, holiday.date, e.target.value as HolidayType)}
                              className="holiday-type-select"
                              style={styles.select}
                            >
                              <option value="work">{HolidayType.showName(HolidayType.Work)}</option>
                              <option value="personal">{HolidayType.showName(HolidayType.Personal)}</option>
                              <option value="other">{HolidayType.showName(HolidayType.Other)}</option>
                            </select>
                            <input
                              type="text"
                              value={holiday.name}
                              onChange={(e) => handleHolidayNameChange(person.id, holiday.date, e.target.value)}
                              className="holiday-name-input"
                              style={styles.input}
                              placeholder="请输入原因"
                            />
                            <input
                              type="date"
                              min={startDate.format('YYYY-MM-DD')}
                              max={endDate.format('YYYY-MM-DD')}
                              className="holiday-date-input"
                              onChange={(e) => {
                                if (e.target.value) {
                                  handleHolidayAdd(person.id, e.target.value);
                                  e.target.value = ''; // 清空输入
                                }
                              }}
                            />
                            <button
                              className="remove-holiday"
                              onClick={() => onPersonHolidayChange(
                                person.id,
                                holiday.date,
                                false,  // isDelete
                                false,  // isCreate
                                false,  // isUpdate
                              )}
                              title="删除假期"
                              style={styles.select}
                            >
                              删除假期
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 
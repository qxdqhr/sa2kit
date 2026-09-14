import { useState } from 'react';
import { Person, HolidayType } from '../../../domain';

export const usePeopleManagement = () => {
    const [numberOfPeople, setNumberOfPeople] = useState(0);
    const [people, setPeople] = useState<Person[]>([]);

    const handleNumberOfPeopleChange = (num: number) => {
        const newNum = Math.max(1, num);
        setNumberOfPeople(newNum);

        if (newNum > people.length) {
            const newPeople = [...people];
            for (let i = people.length; i < newNum; i++) {
                newPeople.push({ id: i, name: `人员 ${i + 1}`, holidays: [] });
            }
            setPeople(newPeople);
        } else if (newNum < people.length) {
            setPeople(people.slice(0, newNum));
        }
    };

    const handlePersonNameChange = (personId: number, newName: string) => {
        setPeople(people.map(p =>
            p.id === personId ? { ...p, name: newName } : p
        ));
    };

    const handlePersonHolidayChange = (
        personId: number,
        date: string,
        isDelete: boolean,
        isCreate: boolean,
        isUpdate: boolean,
        name?: string,
        type: HolidayType = HolidayType.Work
    ) => {
        setPeople(people.map(person => {
            if (person.id !== personId) return person;
            //holiday为false时，删除holiday
            if (!isDelete) {
                return {
                    ...person,
                    holidays: person.holidays.filter(h => h.date !== date)
                };
            }
            else if (isCreate) {
                return {
                    ...person,
                    holidays: [...person.holidays, {
                        date,
                        name: name || '',
                        type
                    }]
                };
            }
            else if (isUpdate) {
                const existingHolidayIndex = person.holidays.findIndex(h => h.date === date);
                if (existingHolidayIndex >= 0) {
                    const updatedHolidays = [...person.holidays];
                    updatedHolidays[existingHolidayIndex] = {
                        date,
                        name: name || '',
                        type
                    };
                    return {
                        ...person,
                        holidays: updatedHolidays
                    };
                }
            }
            return person;
        }));
    };

    return {
        numberOfPeople,
        people,
        setPeople,
        handleNumberOfPeopleChange,
        handlePersonNameChange,
        handlePersonHolidayChange,
    };
};
export interface WorkItem {
  id: string;
  title: string;
  manDays: number;
}

export interface Assignment {
  workId: string;
  personIndex: number;
  startDay: number;
  work: WorkItem;
}

export enum HolidayType {
  Work = 'work',
  Personal = 'personal',
  Other = 'other',
}
export namespace HolidayType{
  export const showName = (type: HolidayType) => {
    switch(type){
      case HolidayType.Work:
        return '工作占用';
      case HolidayType.Personal:
        return '个人休假';
      case HolidayType.Other:
        return '其他';
    }
  }
}

export interface Holiday {
  date: string; // YYYY-MM-DD 格式
  name: string; // 假期名称
  type: HolidayType;
}

export interface Person {
  id: number;
  name: string;
  holidays: Holiday[];
} 
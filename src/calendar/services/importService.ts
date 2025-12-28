/**
 * 日历导入服务
 * 
 * 提供日历事件的导入功能，支持多种格式：
 * - iCal (.ics) 格式
 * - JSON 格式
 * - CSV 格式
 */

import { CreateEventRequest } from '../types';

export interface ImportOptions {
  format: 'ical' | 'json' | 'csv';
  overwriteExisting?: boolean;
  validateEvents?: boolean;
}

export interface ImportResult {
  success: boolean;
  importedCount: number;
  errors: string[];
  events: CreateEventRequest[];
}

export class CalendarImportService {
  /**
   * 从文件导入事件
   */
  static async importFromFile(file: File, options: ImportOptions): Promise<ImportResult> {
    try {
      const content = await this.readFileContent(file);
      return await this.importFromContent(content, options);
    } catch (error) {
      return {
        success: false,
        importedCount: 0,
        errors: [`读取文件失败: ${error instanceof Error ? error.message : '未知错误'}`],
        events: []
      };
    }
  }

  /**
   * 从内容字符串导入事件
   */
  static async importFromContent(content: string, options: ImportOptions): Promise<ImportResult> {
    try {
      let events: CreateEventRequest[] = [];
      
      switch (options.format) {
        case 'ical':
          events = this.parseICalContent(content);
          break;
        case 'json':
          events = this.parseJSONContent(content);
          break;
        case 'csv':
          events = this.parseCSVContent(content);
          break;
        default:
          throw new Error(`不支持的导入格式: ${options.format}`);
      }

      // 验证事件（如果启用）
      if (options.validateEvents) {
        events = this.validateAndFilterEvents(events);
      }

      return {
        success: true,
        importedCount: events.length,
        errors: [],
        events: events
      };
    } catch (error) {
      return {
        success: false,
        importedCount: 0,
        errors: [`解析内容失败: ${error instanceof Error ? error.message : '未知错误'}`],
        events: []
      };
    }
  }

  /**
   * 读取文件内容
   */
  private static readFileContent(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = () => reject(new Error('文件读取失败'));
      reader.readAsText(file);
    });
  }

  /**
   * 解析 iCal 内容
   */
  private static parseICalContent(content: string): CreateEventRequest[] {
    const events: CreateEventRequest[] = [];
    const lines = content.split(/\r?\n/);
    
    let currentEvent: Partial<CreateEventRequest> | null = null;
    let currentProperty = '';
    
    for (let line of lines) {
      line = line.trim();
      
      if (line === 'BEGIN:VEVENT') {
        currentEvent = {};
        continue;
      }
      
      if (line === 'END:VEVENT') {
        if (currentEvent && currentEvent.title && currentEvent.startTime && currentEvent.endTime) {
          events.push(currentEvent as CreateEventRequest);
        }
        currentEvent = null;
        continue;
      }
      
      if (!currentEvent) continue;
      
      // 处理多行属性
      if (line.startsWith(' ') && currentProperty) {
        continue; // 简化处理，跳过多行属性
      }
      
      const colonIndex = line.indexOf(':');
      if (colonIndex === -1) continue;
      
      const property = line.substring(0, colonIndex);
      const value = line.substring(colonIndex + 1);
      currentProperty = property;
      
      switch (property) {
        case 'SUMMARY':
          currentEvent.title = this.unescapeICalText(value);
          break;
        case 'DESCRIPTION':
          currentEvent.description = this.unescapeICalText(value);
          break;
        case 'DTSTART':
          currentEvent.startTime = this.parseICalDateTime(value);
          break;
        case 'DTEND':
          currentEvent.endTime = this.parseICalDateTime(value);
          break;
        case 'LOCATION':
          currentEvent.location = this.unescapeICalText(value);
          break;
                 case 'PRIORITY':
           const priority = this.mapICalPriority(value);
           if (priority) currentEvent.priority = priority as any;
           break;
      }
    }
    
    return events;
  }

  /**
   * 解析 JSON 内容
   */
  private static parseJSONContent(content: string): CreateEventRequest[] {
    const data = JSON.parse(content);
    
    // 如果是导出的格式
    if (data.events && Array.isArray(data.events)) {
      return data.events.map((event: any) => ({
        title: event.title,
        description: event.description,
        startTime: event.startTime,
        endTime: event.endTime,
        allDay: event.allDay || false,
        location: event.location,
        color: event.color,
        priority: event.priority
      }));
    }
    
    // 如果是事件数组
    if (Array.isArray(data)) {
      return data.map((event: any) => ({
        title: event.title,
        description: event.description,
        startTime: event.startTime,
        endTime: event.endTime,
        allDay: event.allDay || false,
        location: event.location,
        color: event.color,
        priority: event.priority
      }));
    }
    
    throw new Error('无效的 JSON 格式');
  }

  /**
   * 解析 CSV 内容
   */
  private static parseCSVContent(content: string): CreateEventRequest[] {
    const lines = content.split(/\r?\n/);
    if (lines.length < 2) {
      throw new Error('CSV 文件必须包含标题行和至少一行数据');
    }
    
    const firstLine = lines[0];
    if (firstLine === undefined) {
      throw new Error('CSV 文件为空');
    }
    
    const headers = this.parseCSVLine(firstLine);
    const events: CreateEventRequest[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const currentLine = lines[i];
      if (currentLine === undefined) continue;
      
      const line = currentLine.trim();
      if (!line) continue;
      
      const values = this.parseCSVLine(line);
      if (values.length !== headers.length) continue;
      
      const event: Partial<CreateEventRequest> = {};
      
      headers.forEach((header, index) => {
        const value = values[index];
        switch (header.toLowerCase()) {
          case '标题':
          case 'title':
            event.title = value;
            break;
          case '描述':
          case 'description':
            event.description = value;
            break;
          case '开始时间':
          case 'start_time':
          case 'starttime':
            event.startTime = value;
            break;
          case '结束时间':
          case 'end_time':
          case 'endtime':
            event.endTime = value;
            break;
          case '全天':
          case 'all_day':
          case 'allday':
            event.allDay = value === '是' || value === 'true' || value === 'True';
            break;
          case '地点':
          case 'location':
            event.location = value;
            break;
          case '颜色':
          case 'color':
            event.color = value;
            break;
          case '优先级':
          case 'priority':
            event.priority = value as any;
            break;
        }
      });
      
      if (event.title && event.startTime && event.endTime) {
        events.push(event as CreateEventRequest);
      }
    }
    
    return events;
  }

  /**
   * 解析 CSV 行
   */
  private static parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++; // 跳过下一个引号
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current);
    return result;
  }

  /**
   * 验证和过滤事件
   */
  private static validateAndFilterEvents(events: CreateEventRequest[]): CreateEventRequest[] {
    return events.filter(event => {
      // 基本验证
      if (!event.title || !event.startTime || !event.endTime) {
        return false;
      }
      
      // 时间验证
      const startTime = new Date(event.startTime);
      const endTime = new Date(event.endTime);
      
      if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
        return false;
      }
      
      if (endTime <= startTime) {
        return false;
      }
      
      return true;
    });
  }

  /**
   * 解析 iCal 日期时间
   */
  private static parseICalDateTime(value: string): string {
    // 简化处理，支持基本的 iCal 日期时间格式
    if (value.includes('T')) {
      // 有时间的格式：20240315T093000Z
      const dateTime = value.replace(/[^\d]/g, '');
      if (dateTime.length >= 14) {
        const year = dateTime.substring(0, 4);
        const month = dateTime.substring(4, 6);
        const day = dateTime.substring(6, 8);
        const hour = dateTime.substring(8, 10);
        const minute = dateTime.substring(10, 12);
        const second = dateTime.substring(12, 14);
        return `${year}-${month}-${day}T${hour}:${minute}:${second}.000Z`;
      }
    } else {
      // 只有日期的格式：20240315
      const dateOnly = value.replace(/[^\d]/g, '');
      if (dateOnly.length >= 8) {
        const year = dateOnly.substring(0, 4);
        const month = dateOnly.substring(4, 6);
        const day = dateOnly.substring(6, 8);
        return `${year}-${month}-${day}T00:00:00.000Z`;
      }
    }
    
    return new Date().toISOString(); // 默认返回当前时间
  }

  /**
   * 反转义 iCal 文本
   */
  private static unescapeICalText(text: string): string {
    return text
      .replace(/\\n/g, '\n')
      .replace(/\\,/g, ',')
      .replace(/\\;/g, ';')
      .replace(/\\\\/g, '\\');
  }

  /**
   * 映射 iCal 优先级
   */
  private static mapICalPriority(value: string): string | undefined {
    const priority = parseInt(value);
    if (priority >= 1 && priority <= 3) return 'high';
    if (priority >= 4 && priority <= 6) return 'normal';
    if (priority >= 7 && priority <= 9) return 'low';
    return undefined;
  }
}

export default CalendarImportService; 
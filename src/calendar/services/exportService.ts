/**
 * 日历导出服务
 * 
 * 提供日历事件的导出功能，支持多种格式：
 * - iCal (.ics) 格式
 * - JSON 格式
 * - CSV 格式
 */

import { CalendarEvent } from '../types';

export interface ExportOptions {
  format: 'ical' | 'json' | 'csv';
  dateRange?: {
    start: Date;
    end: Date;
  };
  includeCompleted?: boolean;
}

export class CalendarExportService {
  /**
   * 导出事件到指定格式
   */
  static async exportEvents(events: CalendarEvent[], options: ExportOptions): Promise<string> {
    switch (options.format) {
      case 'ical':
        return this.exportToICal(events);
      case 'json':
        return this.exportToJSON(events);
      case 'csv':
        return this.exportToCSV(events);
      default:
        throw new Error(`不支持的导出格式: ${options.format}`);
    }
  }

  /**
   * 导出为 iCal (.ics) 格式
   */
  private static exportToICal(events: CalendarEvent[]): string {
    const lines: string[] = [];
    
    // iCal 文件头
    lines.push('BEGIN:VCALENDAR');
    lines.push('VERSION:2.0');
    lines.push('PRODID:-//Profile-v1//Calendar Module//CN');
    lines.push('CALSCALE:GREGORIAN');
    lines.push('METHOD:PUBLISH');
    
    // 导出每个事件
    events.forEach(event => {
      lines.push('BEGIN:VEVENT');
      lines.push(`UID:${event.id}@profile-v1.calendar`);
      lines.push(`DTSTART:${this.formatDateTimeToICal(new Date(event.startTime))}`);
      lines.push(`DTEND:${this.formatDateTimeToICal(new Date(event.endTime))}`);
      lines.push(`DTSTAMP:${this.formatDateTimeToICal(new Date(event.createdAt))}`);
      lines.push(`SUMMARY:${this.escapeICalText(event.title)}`);
      
      if (event.description) {
        lines.push(`DESCRIPTION:${this.escapeICalText(event.description)}`);
      }
      
      if (event.location) {
        lines.push(`LOCATION:${this.escapeICalText(event.location)}`);
      }
      
      // 优先级
      if (event.priority) {
        const priorityMap: Record<string, string> = {
          'low': '9',
          'normal': '5',
          'high': '1'
        };
        lines.push(`PRIORITY:${priorityMap[event.priority] || '5'}`);
      }
      
      // 全天事件
      if (event.allDay) {
        lines.push('X-MICROSOFT-CDO-ALLDAYEVENT:TRUE');
      }
      
      lines.push('END:VEVENT');
    });
    
    // iCal 文件尾
    lines.push('END:VCALENDAR');
    
    return lines.join('\r\n');
  }

  /**
   * 导出为 JSON 格式
   */
  private static exportToJSON(events: CalendarEvent[]): string {
    const exportData = {
      exportedAt: new Date().toISOString(),
      version: '1.0',
      source: 'Profile-v1 Calendar',
      events: events.map(event => ({
        id: event.id,
        title: event.title,
        description: event.description,
        startTime: event.startTime,
        endTime: event.endTime,
        allDay: event.allDay,
        location: event.location,
        color: event.color,
        priority: event.priority,
        createdAt: event.createdAt,
        updatedAt: event.updatedAt
      }))
    };
    
    return JSON.stringify(exportData, null, 2);
  }

  /**
   * 导出为 CSV 格式
   */
  private static exportToCSV(events: CalendarEvent[]): string {
    const headers = [
      'ID',
      '标题',
      '描述',
      '开始时间',
      '结束时间',
      '全天',
      '地点',
      '颜色',
      '优先级',
      '创建时间',
      '更新时间'
    ];
    
    const rows = events.map(event => [
      event.id,
      this.escapeCSVField(event.title),
      this.escapeCSVField(event.description || ''),
      event.startTime,
      event.endTime,
      event.allDay ? '是' : '否',
      this.escapeCSVField(event.location || ''),
      event.color || '',
      event.priority || '',
      event.createdAt,
      event.updatedAt || ''
    ]);
    
    const csvLines = [headers.join(',')];
    rows.forEach(row => {
      csvLines.push(row.join(','));
    });
    
    return csvLines.join('\n');
  }

  /**
   * 下载导出的文件
   */
  static downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    URL.revokeObjectURL(url);
  }

  /**
   * 获导出方法的便捷函数
   */
  static async exportAndDownload(
    events: CalendarEvent[], 
    options: ExportOptions,
    filename?: string
  ): Promise<void> {
    const content = await this.exportEvents(events, options);
    
    const defaultFilenames = {
      ical: 'calendar-events.ics',
      json: 'calendar-events.json',
      csv: 'calendar-events.csv'
    };
    
    const mimeTypes = {
      ical: 'text/calendar',
      json: 'application/json',
      csv: 'text/csv'
    };
    
    const finalFilename = filename || defaultFilenames[options.format];
    const mimeType = mimeTypes[options.format];
    
    this.downloadFile(content, finalFilename, mimeType);
  }

  /**
   * 格式化日期时间为 iCal 格式
   */
  private static formatDateTimeToICal(date: Date): string {
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  }

  /**
   * 转义 iCal 文本
   */
  private static escapeICalText(text: string): string {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '');
  }

  /**
   * 转义 CSV 字段
   */
  private static escapeCSVField(field: string): string {
    if (field.includes(',') || field.includes('"') || field.includes('\n')) {
      return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
  }
}

export default CalendarExportService; 
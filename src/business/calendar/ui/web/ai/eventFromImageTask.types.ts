export interface CalendarEventFromImageInput {
  imageBase64: string;
  mimeType: string;
  timezone?: string;
  locale?: string;
  referenceDate?: string;
}

export interface CalendarEventFromImageOutput {
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  allDay: boolean;
  location?: string;
  confidence: number;
  rawSummary?: string;
}

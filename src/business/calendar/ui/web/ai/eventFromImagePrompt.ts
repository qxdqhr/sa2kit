import type {
  CalendarEventFromImageInput,
  CalendarEventFromImageOutput,
} from './eventFromImageTask.types';
import { parseEventDateTime } from '../utils/dateUtils';

const EVENT_JSON_SCHEMA_HINT = [
  'title(string), description?(string), startTime(ISO8601), endTime(ISO8601),',
  'allDay(boolean), location?(string), confidence(0-1 number), rawSummary?(string)',
].join(' ');

export function buildEventFromImagePrompt(input: CalendarEventFromImageInput): {
  systemPrompt: string;
  userPrompt: string;
  jsonSchemaHint: string;
} {
  const timezone = input.timezone || 'Asia/Shanghai';
  const locale = input.locale || 'zh-CN';
  const referenceDate = input.referenceDate || new Date().toISOString();

  const systemPrompt = [
    '你是日历活动信息提取助手。',
    '从用户提供的图片中识别会议、票务、海报、行程单等活动信息。',
    `时区: ${timezone}，语言: ${locale}，参考当前时间: ${referenceDate}。`,
    '必须输出单个 JSON 对象，字段：',
    EVENT_JSON_SCHEMA_HINT + '。',
    '若无法确定精确时间，根据图片内容合理推断；全天活动 allDay=true。',
    '不要输出 Markdown。',
  ].join('\n');

  return {
    systemPrompt,
    userPrompt: '请识别图片中的活动并输出 JSON。',
    jsonSchemaHint: EVENT_JSON_SCHEMA_HINT,
  };
}

export function parseEventFromImageOutput(
  json: Record<string, unknown>
): CalendarEventFromImageOutput {
  const title = String(json.title ?? '').trim();
  const startRaw = String(json.startTime ?? '').trim();
  const endRaw = String(json.endTime ?? '').trim();

  if (!title) throw new Error('未能识别活动标题');
  if (!startRaw || !endRaw) throw new Error('未能识别活动时间，请手动填写');

  const allDay = Boolean(json.allDay);
  const startDate = parseEventDateTime(startRaw);
  const endDate = parseEventDateTime(endRaw);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    throw new Error('未能识别有效的活动时间，请手动填写');
  }

  const confidenceRaw = Number(json.confidence);
  const confidence = Number.isFinite(confidenceRaw)
    ? Math.min(1, Math.max(0, confidenceRaw))
    : 0.5;

  return {
    title,
    description: json.description ? String(json.description) : undefined,
    startTime: startDate.toISOString(),
    endTime: endDate.toISOString(),
    allDay,
    location: json.location ? String(json.location) : undefined,
    confidence,
    rawSummary: json.rawSummary ? String(json.rawSummary) : undefined,
  };
}

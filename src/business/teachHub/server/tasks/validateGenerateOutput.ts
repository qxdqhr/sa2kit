import type { GenerateLessonOutput } from '../../domain';

export type RawGenerateLessonJson = {
  lesson?: {
    order?: number;
    slug?: string;
    title?: string;
    html?: string;
  };
  learningRecord?: {
    order?: number;
    slug?: string;
    markdown?: string;
  } | null;
  reference?: {
    slug?: string;
    html?: string;
  } | null;
};

export function parseGenerateLessonJson(raw: Record<string, unknown>): RawGenerateLessonJson {
  return raw as RawGenerateLessonJson;
}

export function validateGenerateLessonOutput(
  raw: RawGenerateLessonJson,
  expectedOrder: number,
): GenerateLessonOutput {
  const lesson = raw.lesson;
  if (!lesson || typeof lesson !== 'object') {
    throw new Error('输出缺少 lesson 对象');
  }

  const order = Number(lesson.order);
  if (!Number.isFinite(order) || order !== expectedOrder) {
    throw new Error(`lesson.order 必须为 ${expectedOrder}`);
  }

  const slug = typeof lesson.slug === 'string' ? lesson.slug.trim() : '';
  const orderPrefix = String(expectedOrder).padStart(4, '0');
  if (!slug.startsWith(`${orderPrefix}-`)) {
    throw new Error(`lesson.slug 必须以 ${orderPrefix}- 开头`);
  }

  const html = typeof lesson.html === 'string' ? lesson.html.trim() : '';
  if (!html.includes('<html') && !html.includes('<!DOCTYPE')) {
    throw new Error('lesson.html 必须是完整 HTML 文档');
  }
  if (!html.includes('check-btn') && !html.includes('检查答案')) {
    throw new Error('lesson.html 应包含测验与检查答案按钮');
  }

  const result: GenerateLessonOutput = {
    lesson: {
      order,
      slug,
      html,
    },
  };

  if (raw.learningRecord && typeof raw.learningRecord === 'object') {
    const rec = raw.learningRecord;
    const recSlug = typeof rec.slug === 'string' ? rec.slug.trim() : '';
    const markdown = typeof rec.markdown === 'string' ? rec.markdown.trim() : '';
    if (recSlug && markdown) {
      result.learningRecord = {
        order: Number(rec.order) || expectedOrder,
        slug: recSlug,
        markdown,
      };
    }
  }

  if (raw.reference && typeof raw.reference === 'object') {
    const ref = raw.reference;
    const refSlug = typeof ref.slug === 'string' ? ref.slug.trim() : '';
    const refHtml = typeof ref.html === 'string' ? ref.html.trim() : '';
    if (refSlug && refHtml && (refHtml.includes('<html') || refHtml.includes('<!DOCTYPE'))) {
      result.reference = { slug: refSlug, html: refHtml };
    }
  }

  return result;
}

export function outputFilePaths(output: GenerateLessonOutput): string[] {
  const paths = [`lessons/${output.lesson.slug}.html`];
  if (output.learningRecord) {
    const recOrder = String(output.learningRecord.order).padStart(4, '0');
    paths.push(`learning-records/${recOrder}-${output.learningRecord.slug}.md`);
  }
  if (output.reference) {
    paths.push(`reference/${output.reference.slug}.html`);
  }
  return paths;
}

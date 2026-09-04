/**
 * 改写 teach 课时 / 参考页 HTML 内的相对链接。
 * publicBase 由宿主注入（含网关 basePath）。
 */

export function rewriteTeachHtmlLinks(
  html: string,
  workspaceId: string,
  publicBase: string,
): string {
  const base = `${publicBase}/w/${workspaceId}`;
  const lessonHref = (filename: string) => {
    const slug = filename.replace(/\.html$/i, '');
    return `${base}/lesson/${slug}`;
  };
  const referenceHref = (filename: string) => {
    const slug = filename.replace(/\.html$/i, '');
    return `${base}/reference/${slug}`;
  };

  let out = html;

  out = out.replace(
    /href=(["'])\.\.\/lessons\/([^"']+?)\1/gi,
    (_match, quote: string, file: string) => `href=${quote}${lessonHref(file)}${quote}`,
  );
  out = out.replace(
    /href=(["'])\.\.\/reference\/([^"']+?)\1/gi,
    (_match, quote: string, file: string) => `href=${quote}${referenceHref(file)}${quote}`,
  );
  out = out.replace(/href=(["'])\.\.\/MISSION\.md\1/gi, `href=$1${base}/mission$1`);
  out = out.replace(/href=(["'])\.\.\/RESOURCES\.md\1/gi, `href=$1${base}/resources$1`);
  out = out.replace(/href=(["'])\.\.\/NOTES\.md\1/gi, `href=$1${base}/notes$1`);
  out = out.replace(
    /href=(["'])lessons\/([^"']+?)\1/gi,
    (_match, quote: string, file: string) => `href=${quote}${lessonHref(file)}${quote}`,
  );
  out = out.replace(
    /href=(["'])reference\/([^"']+?)\1/gi,
    (_match, quote: string, file: string) => `href=${quote}${referenceHref(file)}${quote}`,
  );

  if (!/<base\s/i.test(out) && /<head[\s>]/i.test(out)) {
    out = out.replace(/<head([^>]*)>/i, '<head$1><base target="_top" href="/">');
  }

  return out;
}

export function shouldRewriteHtml(relativePath: string): boolean {
  const normalized = relativePath.replaceAll('\\', '/');
  return (
    (normalized.startsWith('lessons/') || normalized.startsWith('reference/')) &&
    normalized.endsWith('.html')
  );
}

export function contentTypeForPath(relativePath: string): string {
  if (relativePath.endsWith('.html')) return 'text/html; charset=utf-8';
  if (relativePath.endsWith('.md')) return 'text/markdown; charset=utf-8';
  if (relativePath.endsWith('.json')) return 'application/json; charset=utf-8';
  return 'text/plain; charset=utf-8';
}

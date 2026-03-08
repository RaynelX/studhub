import { marked } from 'marked';
import DOMPurify from 'dompurify';

// Open links in new tab
const renderer = new marked.Renderer();
const originalLink = renderer.link.bind(renderer);

renderer.link = function (token) {
  const html = originalLink(token);
  return html.replace('<a ', '<a target="_blank" rel="noopener noreferrer" ');
};

marked.setOptions({ renderer, breaks: true, gfm: true });

export function renderMarkdown(content: string): string {
  const raw = marked.parse(content, { async: false }) as string;
  return DOMPurify.sanitize(raw);
}

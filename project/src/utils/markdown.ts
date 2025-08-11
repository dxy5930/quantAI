export function markdownToHtml(markdown: string): string {
  if (!markdown) return '';
  let html = markdown;

  // 代码块 ```
  html = html.replace(/```([\s\S]*?)```/g, (_m, p1) => {
    const code = escapeHtml(p1.trim());
    return `<pre class="rounded bg-gray-100 dark:bg-slate-800 p-3 overflow-x-auto"><code>${code}</code></pre>`;
  });

  // 行内代码 `code`
  html = html.replace(/`([^`]+)`/g, (_m, p1) => `<code class="px-1 rounded bg-gray-100 dark:bg-slate-800">${escapeHtml(p1)}</code>`);

  // 图片 ![alt](url)
  html = html.replace(/!\[([^\]]*)\]\((https?:[^)]+)\)/g, '<img src="$2" alt="$1" class="max-w-full rounded border border-gray-200 dark:border-gray-700" />');

  // 粗体与斜体
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

  // 标题
  html = html.replace(/^###\s+(.+)$/gm, '<h3 class="text-lg font-semibold mt-3 mb-2">$1</h3>');
  html = html.replace(/^##\s+(.+)$/gm, '<h2 class="text-xl font-semibold mt-4 mb-3">$1</h2>');
  html = html.replace(/^#\s+(.+)$/gm, '<h1 class="text-2xl font-bold mt-6 mb-4">$1</h1>');

  // 无序列表
  html = html.replace(/^(?:-\s+.+(?:\n|$))+?/gm, (block) => {
    const items = block
      .trim()
      .split(/\n/)
      .map((line) => line.replace(/^[-*]\s+/, ''))
      .map((li) => `<li>${li}</li>`) 
      .join('');
    return `<ul class="list-disc ml-6 my-2">${items}</ul>`;
  });

  // 有序列表
  html = html.replace(/^(?:\d+\.\s+.+(?:\n|$))+?/gm, (block) => {
    const items = block
      .trim()
      .split(/\n/)
      .map((line) => line.replace(/^\d+\.\s+/, ''))
      .map((li) => `<li>${li}</li>`) 
      .join('');
    return `<ol class="list-decimal ml-6 my-2">${items}</ol>`;
  });

  // 分割线
  html = html.replace(/^---$/gm, '<hr class="my-4"/>' );

  // 链接 [text](url)
  html = html.replace(/\[([^\]]+)\]\((https?:[^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">$1</a>');

  // 段落：跳过已是块级元素或图片的片段
  html = html
    .split(/\n{2,}/)
    .map((chunk) => {
      if (/^<h\d|^<ul|^<ol|^<pre|^<hr|^<img/.test(chunk)) return chunk; // 已渲染块
      const lines = chunk
        .split(/\n/)
        .map((line) => line.trim())
        .filter((l) => l.length > 0);
      if (lines.length === 0) return '';
      return `<p class="my-2 leading-relaxed">${lines.join('<br/>')}</p>`;
    })
    .join('\n');

  return html;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&#39;');
} 
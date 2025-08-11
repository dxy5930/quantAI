import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className }) => {
  const safeContent = content || '';

  return (
    <div className={className || 'prose prose-sm dark:prose-invert max-w-none'}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          a: ({ node, ...props }: any) => (
            <a {...props} target="_blank" rel="noopener noreferrer" />
          ),
          code: ({ inline, className, children, ...props }: any) => (
            inline ? (
              <code className={`px-1 rounded bg-gray-100 dark:bg-slate-800 ${className || ''}`} {...props}>
                {children}
              </code>
            ) : (
              <pre className="rounded bg-gray-100 dark:bg-slate-800 p-3 overflow-x-auto">
                <code className={className} {...props}>{children}</code>
              </pre>
            )
          )
        }}
      >
        {safeContent}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer; 
import ReactMarkdown from 'react-markdown';

interface MarkdownContentProps {
  content: string;
}

export function MarkdownContent({ content }: MarkdownContentProps) {
  return (
    <div className="prose prose-sm max-w-none dark:prose-invert break-words [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
      <ReactMarkdown
        components={{
          code: ({ children, ...props }) => {
            const lang = props.className;
            const isBlock = typeof lang === 'string' && lang.includes('language-');
            if (isBlock) {
              return (
                <pre className="bg-muted/80 rounded-lg p-3 overflow-x-auto text-xs">
                  <code className={lang} {...props}>{children}</code>
                </pre>
              );
            }
            return (
              <code className="bg-muted/80 px-1.5 py-0.5 rounded text-xs font-mono" {...props}>
                {children}
              </code>
            );
          },
          pre: ({ children }) => <>{children}</>,
          a: ({ children, href, ...props }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-2"
              {...props}
            >
              {children}
            </a>
          ),
        }}
      >
        {content || ''}
      </ReactMarkdown>
    </div>
  );
}

import { Copy, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import Markdown from 'react-markdown';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
}

export function ChatMessage({ role, content, timestamp }: ChatMessageProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isUser = role === 'user';

  return (
    <div className={`flex gap-3 mb-4 ${isUser ? 'justify-end' : ''}`}>
      <div
        className={`max-w-2xl ${
          isUser
            ? 'bg-blue-600 text-white rounded-lg rounded-tr-none'
            : 'bg-gray-100 text-gray-900 rounded-lg rounded-tl-none'
        } p-4`}
      >
        {isUser ? (
          <p className="text-sm">{content}</p>
        ) : (
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <Markdown
              components={{
                p: ({ node, ...props }) => <p className="text-sm mb-2" {...props} />,
                ul: ({ node, ...props }) => (
                  <ul className="text-sm list-disc list-inside mb-2" {...props} />
                ),
                ol: ({ node, ...props }) => (
                  <ol className="text-sm list-decimal list-inside mb-2" {...props} />
                ),
                strong: ({ node, ...props }) => (
                  <strong className="font-semibold" {...props} />
                ),
                code: ({ node, ...props }) => (
                  <code className="bg-gray-200 px-1 rounded text-sm" {...props} />
                ),
              }}
            >
              {content}
            </Markdown>
          </div>
        )}

        {!isUser && (
          <button
            onClick={copyToClipboard}
            className="mt-2 text-xs text-gray-600 hover:text-gray-900 flex items-center gap-1"
          >
            {copied ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Copied
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy
              </>
            )}
          </button>
        )}
      </div>

      {timestamp && (
        <div className="text-xs text-gray-500 self-end mb-1">
          {timestamp.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      )}
    </div>
  );
}

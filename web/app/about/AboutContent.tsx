'use client';

import { useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import type { Components } from 'react-markdown';

interface DocEntry {
  id: string;
  label: string;
  content: string;
}

const FILE_TO_TAB: Record<string, string> = {
  'CONTRIBUTING.md': 'contributing',
  'TARGETUSERS.md': 'target-users',
  'TARGET USERS.md': 'target-users',
  'TECHNICAL.md': 'technical',
  'LICENSE': 'license',
  'README.md': 'readme',
  'contribution.md': 'contributing',
};

export default function AboutContent({ docs }: { docs: DocEntry[] }) {
  const [activeTab, setActiveTab] = useState('readme');

  const handleMdLink = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
      const filename = href.split('/').pop() ?? '';
      const tabId = FILE_TO_TAB[filename];
      if (tabId) {
        e.preventDefault();
        setActiveTab(tabId);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },
    [],
  );

  const markdownComponents: Components = {
    a: ({ href, children, ...props }) => {
      if (!href) return <a {...props}>{children}</a>;
      const filename = href.split('/').pop() ?? '';
      if (FILE_TO_TAB[filename]) {
        return (
          <a
            href={href}
            onClick={(e) => handleMdLink(e, href)}
            className="text-blue-600 hover:text-blue-800 underline cursor-pointer"
            {...props}
          >
            {children}
          </a>
        );
      }
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
          {children}
        </a>
      );
    },
    img: ({ src, alt, ...props }) => {
      // Skip images that reference local files not available on the page
      if (src && !src.startsWith('http')) return null;
      return <img src={src} alt={alt ?? ''} {...props} />;
    },
  };

  const activeDoc = docs.find((d) => d.id === activeTab);

  return (
    <div className="min-h-[calc(100vh-100px)] bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Tab navigation */}
        <div className="flex flex-wrap gap-1 mb-6 bg-white rounded-xl shadow-sm border border-gray-200 p-1.5">
          {docs.map((doc) => (
            <button
              key={doc.id}
              onClick={() => setActiveTab(doc.id)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === doc.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {doc.label}
            </button>
          ))}
        </div>

        {/* Markdown content */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-10">
          {activeDoc && (
            <article className="prose prose-gray max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
                components={markdownComponents}
              >
                {activeDoc.content}
              </ReactMarkdown>
            </article>
          )}
        </div>
      </div>
    </div>
  );
}

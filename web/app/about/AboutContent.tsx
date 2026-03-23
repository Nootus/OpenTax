'use client';

import { useState, useCallback, useRef } from 'react';

interface DocEntry {
  id: string;
  label: string;
  html: string;
}

/** Maps markdown filenames (used as hrefs inside docs) to their tab id. */
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
  const contentRef = useRef<HTMLDivElement>(null);

  /** Event-delegation: intercept clicks on cross-doc anchor links. */
  const handleContentClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const anchor = (e.target as HTMLElement).closest('a');
      if (!anchor) return;

      const href = anchor.getAttribute('href') ?? '';
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

  const activeDoc = docs.find((d) => d.id === activeTab);

  return (
    <div className="min-h-[calc(100vh-100px)] bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* Tab navigation */}
        <nav
          aria-label="Documentation sections"
          className="flex flex-wrap justify-center gap-1 mb-6 bg-white rounded-xl shadow-sm border border-gray-200 p-1.5"
        >
          {docs.map((doc) => (
            <button
              key={doc.id}
              onClick={() => setActiveTab(doc.id)}
              aria-current={activeTab === doc.id ? 'page' : undefined}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === doc.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {doc.label}
            </button>
          ))}
        </nav>

        {/* Pre-rendered HTML content */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-10">
          {activeDoc && (
            <div
              ref={contentRef}
              onClick={handleContentClick}
              className={[
                'prose prose-gray max-w-none',
                'prose-headings:font-semibold prose-headings:tracking-tight',
                'prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl',
                'prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline',
                'prose-code:bg-gray-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono',
                'prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:rounded-xl prose-pre:overflow-x-auto',
                'prose-blockquote:border-l-4 prose-blockquote:border-blue-300 prose-blockquote:bg-blue-50 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r-lg',
                'prose-table:w-full prose-th:bg-gray-50 prose-th:text-left prose-td:align-top',
                'prose-img:rounded-lg prose-img:shadow-sm',
                'prose-li:my-0.5',
              ].join(' ')}
              dangerouslySetInnerHTML={{ __html: activeDoc.html }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

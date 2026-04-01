
import React, { useEffect, useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import mermaid from 'mermaid';
import saveAs from 'file-saver'; // Changed from { saveAs }
import JSZip from 'jszip';
import { type TutorialOutputData } from '../types';
import { DownloadIcon, DocumentTextIcon, ChevronDownIcon, ChevronUpIcon } from './Icons';

interface TutorialOutputProps {
  output: TutorialOutputData;
  projectName: string;
}

const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
  const markdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (markdownRef.current) {
      const codeElements = markdownRef.current.querySelectorAll('pre code.language-mermaid');
      codeElements.forEach(async (el, index) => {
        const diagramId = `mermaid-diagram-${Date.now()}-${index}`;
        const diagramContainer = document.createElement('div');
        diagramContainer.id = diagramId;
        diagramContainer.className = 'mermaid-diagram-container flex justify-center my-4 p-4 bg-slate-50 rounded-lg overflow-auto';
        
        // Replace the <pre><code> block with this container
        const parent = el.parentElement?.parentElement; // pre -> div created by react-markdown
        if (parent) {
            parent.parentNode?.replaceChild(diagramContainer, parent);
        }
        
        try {
          const { svg } = await mermaid.render(diagramId, el.textContent || '');
          diagramContainer.innerHTML = svg;
        } catch (error) {
          console.error('Mermaid rendering error:', error);
          diagramContainer.innerHTML = `<p class="text-red-500">Error rendering diagram: ${(error as Error).message}</p>`;
        }
      });
    }
  }, [content]);

  return (
    <div ref={markdownRef}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({node, ...props}) => <h1 className="text-3xl font-bold mt-6 mb-3 pb-2 border-b border-slate-200" {...props} />,
          h2: ({node, ...props}) => <h2 className="text-2xl font-semibold mt-5 mb-2 pb-1 border-b border-slate-200" {...props} />,
          h3: ({node, ...props}) => <h3 className="text-xl font-semibold mt-4 mb-2" {...props} />,
          p: ({node, ...props}) => <p className="mb-4 text-slate-700 leading-relaxed" {...props} />,
          ul: ({node, ...props}) => <ul className="list-disc list-inside mb-4 pl-4 text-slate-700" {...props} />,
          ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-4 pl-4 text-slate-700" {...props} />,
          li: ({node, ...props}) => <li className="mb-1" {...props} />,
          code: ({node, inline, className, children, ...props}) => {
            const match = /language-(\w+)/.exec(className || '');
            if (!inline && match && match[1] === 'mermaid') {
              // Mermaid will be handled by useEffect above
              return <pre className={className}><code {...props} className={className}>{String(children)}</code></pre>;
            }
            return !inline ? (
              <pre className={`${className} bg-slate-800 text-slate-100 p-4 rounded-lg overflow-x-auto my-4 text-sm shadow-md`} {...props}>
                <code>{String(children)}</code>
              </pre>
            ) : (
              <code className="bg-slate-200 text-slate-800 px-1 py-0.5 rounded text-sm font-mono" {...props}>
                {String(children)}
              </code>
            );
          },
          a: ({node, ...props}) => <a className="text-sky-600 hover:text-sky-700 hover:underline" {...props} />,
          blockquote: ({node, ...props}) => <blockquote className="pl-4 border-l-4 border-slate-300 text-slate-600 italic my-4" {...props} />,
          table: ({node, ...props}) => <table className="table-auto w-full my-4 border-collapse border border-slate-300" {...props} />,
          th: ({node, ...props}) => <th className="border border-slate-300 px-4 py-2 bg-slate-100 text-left font-semibold" {...props} />,
          td: ({node, ...props}) => <td className="border border-slate-300 px-4 py-2" {...props} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export const TutorialOutput: React.FC<TutorialOutputProps> = ({ output, projectName }) => {
  const [activeTab, setActiveTab] = useState<string>('index.md');
  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>({});

  const handleDownloadZip = async () => {
    const zip = new JSZip();
    zip.file('index.md', output.indexMdContent);
    output.chapters.forEach(chapter => {
      zip.file(chapter.filename, chapter.content);
    });
    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, `${projectName.replace(/\s+/g, '_')}_tutorial.zip`);
  };

  const toggleChapter = (filename: string) => {
    setExpandedChapters(prev => ({ ...prev, [filename]: !prev[filename] }));
  };
  
  useEffect(() => {
    mermaid.run();
  }, [activeTab, output]); // Rerun mermaid when tab changes or output changes

  return (
    <div className="mt-8 p-4 sm:p-6 bg-white rounded-xl shadow-xl">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 pb-4 border-b border-slate-200">
        <h2 className="text-2xl font-semibold text-slate-800 mb-2 sm:mb-0">Generated Tutorial</h2>
        <button
          onClick={handleDownloadZip}
          className="flex items-center bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-transform transform hover:scale-105"
        >
          <DownloadIcon className="w-5 h-5 mr-2" />
          Download Tutorial (.zip)
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar for navigation */}
        <nav className="md:w-1/4 lg:w-1/5 bg-slate-50 p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-slate-700 mb-3">Table of Contents</h3>
          <ul>
            <li>
              <button
                onClick={() => setActiveTab('index.md')}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center ${activeTab === 'index.md' ? 'bg-sky-100 text-sky-700 font-medium' : 'text-slate-600 hover:bg-slate-200'}`}
              >
                <DocumentTextIcon className="w-4 h-4 mr-2 flex-shrink-0" />
                <span className="truncate">Home (index.md)</span>
              </button>
            </li>
            {output.chapters.map((chapter) => (
              <li key={chapter.filename} className="mt-1">
                <button
                  onClick={() => setActiveTab(chapter.filename)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center ${activeTab === chapter.filename ? 'bg-sky-100 text-sky-700 font-medium' : 'text-slate-600 hover:bg-slate-200'}`}
                >
                  <DocumentTextIcon className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span className="truncate">{chapter.title}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Content Area */}
        <div className="md:w-3/4 lg:w-4/5">
          <div className="prose max-w-none p-4 border border-slate-200 rounded-lg shadow-inner bg-white min-h-[400px] overflow-y-auto">
            {activeTab === 'index.md' && <MarkdownRenderer content={output.indexMdContent} />}
            {output.chapters.map((chapter) => (
              activeTab === chapter.filename && <MarkdownRenderer key={chapter.filename} content={chapter.content} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

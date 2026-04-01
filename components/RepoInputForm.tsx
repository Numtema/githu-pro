import React, { useState, ChangeEvent } from 'react';
import { Language, LANGUAGES, DEFAULT_INCLUDE_PATTERNS_STRING, DEFAULT_EXCLUDE_PATTERNS_STRING } from '../types';
import { ArrowRightIcon, GithubIcon, DocumentTextIcon, SparklesIcon, CogIcon, CloudArrowUpIcon } from './Icons';

export interface RepoInputFormState {
  sourceType: 'github' | 'paste' | 'upload';
  repoUrl: string;
  githubToken: string;
  projectName: string;
  pastedCode: string;
  uploadedFiles: FileList | null;
  includePatterns: string;
  excludePatterns: string;
  maxFileSize: number;
  language: Language;
  maxAbstractions: number;
  useCache: boolean;
}

interface RepoInputFormProps {
  onSubmit: (data: RepoInputFormState) => void;
  isLoading: boolean;
}

// Define a type for the input props that includes the non-standard attributes.
// This mirrors the augmentation in types.ts but applies it locally.
interface FileInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  webkitdirectory?: string;
  directory?: string;
}

export const RepoInputForm: React.FC<RepoInputFormProps> = ({ onSubmit, isLoading }) => {
  const [formData, setFormData] = useState<RepoInputFormState>({
    sourceType: 'github',
    repoUrl: '',
    githubToken: '',
    projectName: '',
    pastedCode: '',
    uploadedFiles: null,
    includePatterns: DEFAULT_INCLUDE_PATTERNS_STRING,
    excludePatterns: DEFAULT_EXCLUDE_PATTERNS_STRING,
    maxFileSize: 100000, // 100KB
    language: 'english',
    maxAbstractions: 10,
    useCache: true,
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
        setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else if (type === 'file') {
        setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).files }));
    }
    else {
        setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseInt(value, 10) : value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const inputClass = "mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 disabled:bg-slate-50 disabled:text-slate-500 disabled:border-slate-200 disabled:shadow-none";
  const labelClass = "block text-sm font-medium text-slate-700";

  // Prepare props for the file input, typed with FileInputProps
  const fileInputProps: FileInputProps = {
    type: "file",
    name: "uploadedFiles",
    id: "uploadedFiles",
    onChange: handleChange,
    multiple: true,
    webkitdirectory: "", // HTML attribute passed as string
    directory: "",     // HTML attribute passed as string
    className: `${inputClass} file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100`
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 p-6 sm:p-8 bg-white rounded-xl shadow-xl">
      <div>
        <h2 className="text-2xl font-semibold text-slate-800 mb-1 flex items-center">
            <SparklesIcon className="w-7 h-7 mr-2 text-sky-500"/>
            Code Source & Project Details
        </h2>
        <p className="text-sm text-slate-500 mb-6">Provide the source code and some basic project information.</p>

        <div className="mb-6">
            <label className={labelClass}>Source Type</label>
            <div className="mt-2 flex space-x-4">
                {(['github', 'paste', 'upload'] as const).map((type) => (
                    <button
                        key={type}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, sourceType: type }))}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center
                            ${formData.sourceType === type 
                                ? 'bg-sky-600 text-white shadow-md' 
                                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}
                    >
                        {type === 'github' && <GithubIcon className="w-4 h-4 mr-2" />}
                        {type === 'paste' && <DocumentTextIcon className="w-4 h-4 mr-2" />}
                        {type === 'upload' && <CloudArrowUpIcon className="w-4 h-4 mr-2" />}
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                ))}
            </div>
        </div>

        {formData.sourceType === 'github' && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                    <label htmlFor="repoUrl" className={labelClass}>GitHub Repository URL</label>
                    <input type="url" name="repoUrl" id="repoUrl" value={formData.repoUrl} onChange={handleChange} className={inputClass} placeholder="https://github.com/user/repo" />
                </div>
                <div>
                    <label htmlFor="githubToken" className={labelClass}>GitHub Token (Optional)</label>
                    <input type="password" name="githubToken" id="githubToken" value={formData.githubToken} onChange={handleChange} className={inputClass} placeholder="For private repos or rate limits" />
                </div>
            </div>
        )}

        {formData.sourceType === 'paste' && (
             <div>
                <label htmlFor="pastedCode" className={labelClass}>Paste Code Content</label>
                <textarea name="pastedCode" id="pastedCode" value={formData.pastedCode} onChange={handleChange} rows={10} className={`${inputClass} min-h-[200px]`} placeholder="Paste file contents here, separate files with '--- FILEPATH: path/to/file.ext ---' on a new line." />
                <p className="mt-1 text-xs text-slate-500">Separate files with \`--- FILEPATH: path/to/file.ext ---\` on a new line before each file's content.</p>
            </div>
        )}

        {formData.sourceType === 'upload' && (
             <div>
                <label htmlFor="uploadedFiles" className={labelClass}>Upload Files/Folder</label>
                 <input {...fileInputProps} />
                <p className="mt-1 text-xs text-slate-500">You can select multiple files or a single folder.</p>
            </div>
        )}


        <div className="mt-6">
            <label htmlFor="projectName" className={labelClass}>Project Name (Optional)</label>
            <input type="text" name="projectName" id="projectName" value={formData.projectName} onChange={handleChange} className={inputClass} placeholder="My Awesome Project" />
            <p className="mt-1 text-xs text-slate-500">If not provided, it will be derived from the URL or a default name.</p>
        </div>
      </div>
      
      <div>
        <h2 className="text-2xl font-semibold text-slate-800 mb-1 flex items-center">
            <CogIcon className="w-7 h-7 mr-2 text-teal-500" />
            Configuration
        </h2>
        <p className="text-sm text-slate-500 mb-6">Customize file processing and generation parameters.</p>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
                <label htmlFor="includePatterns" className={labelClass}>Include Patterns</label>
                <input type="text" name="includePatterns" id="includePatterns" value={formData.includePatterns} onChange={handleChange} className={inputClass} placeholder="*.js, *.py" />
                <p className="mt-1 text-xs text-slate-500">Comma-separated glob patterns.</p>
            </div>
            <div>
                <label htmlFor="excludePatterns" className={labelClass}>Exclude Patterns</label>
                <input type="text" name="excludePatterns" id="excludePatterns" value={formData.excludePatterns} onChange={handleChange} className={inputClass} placeholder="node_modules/*, *.test.js" />
                 <p className="mt-1 text-xs text-slate-500">Comma-separated glob patterns.</p>
            </div>
            <div>
                <label htmlFor="maxFileSize" className={labelClass}>Max File Size (Bytes)</label>
                <input type="number" name="maxFileSize" id="maxFileSize" value={formData.maxFileSize} onChange={handleChange} className={inputClass} />
            </div>
            <div>
                <label htmlFor="language" className={labelClass}>Tutorial Language</label>
                <select name="language" id="language" value={formData.language} onChange={handleChange} className={inputClass}>
                {LANGUAGES.map(lang => (
                    <option key={lang.value} value={lang.value}>{lang.label}</option>
                ))}
                </select>
            </div>
            <div>
                <label htmlFor="maxAbstractions" className={labelClass}>Max Abstractions</label>
                <input type="number" name="maxAbstractions" id="maxAbstractions" value={formData.maxAbstractions} onChange={handleChange} className={inputClass} min="3" max="20" />
            </div>
            <div className="flex items-center pt-6">
                <input type="checkbox" name="useCache" id="useCache" checked={formData.useCache} onChange={handleChange} className="h-4 w-4 text-sky-600 border-slate-300 rounded focus:ring-sky-500" />
                <label htmlFor="useCache" className="ml-2 block text-sm text-slate-700">Use LLM Response Cache</label>
            </div>
        </div>
      </div>

      <div className="pt-2">
        <button 
          type="submit" 
          disabled={isLoading} 
          className="w-full flex items-center justify-center px-6 py-3 border border-transparent rounded-lg shadow-lg text-base font-medium text-white bg-gradient-to-r from-sky-500 to-teal-400 hover:from-sky-600 hover:to-teal-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:opacity-50 transition-transform transform hover:scale-105"
        >
          {isLoading ? 'Processing...' : 'Generate Tutorial'}
          {!isLoading && <ArrowRightIcon className="ml-2 w-5 h-5" />}
        </button>
      </div>
    </form>
  );
};

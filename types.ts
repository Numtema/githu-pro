export interface FileData {
  path: string;
  content: string;
}

export interface Abstraction {
  index: number; // Keep track of original index if needed for ordering/linking
  name: string;
  description: string;
  file_indices: number[]; // Indices relative to the initial filesData array
  files?: string[]; // Actual file paths, can be resolved later
}

export interface RelationshipData {
  from: number; // Index of source abstraction
  to: number; // Index of target abstraction
  label: string;
}

export interface ProjectAnalysis {
  summary: string;
  details: RelationshipData[];
}

export interface ChapterResult {
  title: string;
  content: string;
  filename: string;
}

export interface TutorialOutputData {
  indexMdContent: string;
  chapters: ChapterResult[];
  mermaidDiagram: string;
}

export enum ProcessingStep {
  IDLE = 0,
  FETCHING_FILES = 1,
  IDENTIFYING_ABSTRACTIONS = 2,
  ANALYZING_RELATIONSHIPS = 3,
  ORDERING_CHAPTERS = 4,
  WRITING_CHAPTERS = 5,
  COMBINING_TUTORIAL = 6,
  DONE = 7,
  ERROR = 8,
}

export type Language = 'english' | 'french' | 'spanish' | 'german' | 'chinese'; // Add more as needed

export const LANGUAGES: { value: Language; label: string }[] = [
  { value: 'english', label: 'English' },
  { value: 'french', label: 'French' },
  { value: 'spanish', label: 'Spanish' },
  { value: 'german', label: 'German' },
  { value: 'chinese', label: 'Chinese' },
];

export const DEFAULT_INCLUDE_PATTERNS_STRING = "*.py, *.js, *.jsx, *.ts, *.tsx, *.go, *.java, *.c, *.cc, *.cpp, *.h, *.md, *.rst, *Dockerfile, *Makefile, *.yaml, *.yml";
export const DEFAULT_EXCLUDE_PATTERNS_STRING = "assets/*, data/*, images/*, public/*, static/*, temp/*, *docs/*, *venv/*, *.venv/*, *test*, *tests/*, *examples/*, v1/*, *dist/*, *build/*, *experimental/*, *deprecated/*, *misc/*, *legacy/*, .git/*, .github/*, .next/*, .vscode/*, *obj/*, *bin/*, *node_modules/*, *.log";

export interface ChapterContextInfo {
  num: number;
  name: string;
  filename: string;
}

export interface LLMCacheEntry {
  prompt: string;
  response: any;
  timestamp: number;
}

// Augment JSX intrinsic elements to allow webkitdirectory and directory attributes for input elements
declare global {
  namespace JSX {
    interface IntrinsicElements {
      input: React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement> & {
        webkitdirectory?: string;
        directory?: string;
      };
    }
  }
}

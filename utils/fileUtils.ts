
import { type FileData } from '../types';

export const parseFileContent = (pastedCode: string): FileData[] => {
  const files: FileData[] = [];
  const fileDelimiter = /--- FILEPATH: (.*?) ---/g;
  let lastIndex = 0;
  let match;

  const contentParts = pastedCode.split(fileDelimiter);
  
  if (contentParts.length <= 1 && pastedCode.trim().length > 0) {
    // No delimiter found, treat as single file
    return [{ path: 'pasted_file.txt', content: pastedCode.trim() }];
  }

  // First part is content before the first delimiter (if any, usually empty or preamble)
  // Then pairs of [filepath, content, filepath, content, ...]
  for (let i = 1; i < contentParts.length; i += 2) {
    const path = contentParts[i].trim();
    const content = contentParts[i+1]?.trim() || ""; // content might be empty
    if (path) {
        files.push({ path, content });
    }
  }
  return files;
};


import { GITHUB_API_BASE_URL } from '../constants';
import { type FileData } from '../types';
import { minimatch } from 'minimatch';

interface GitHubContent {
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  html_url: string;
  git_url: string;
  download_url: string | null;
  type: 'file' | 'dir';
  content?: string; // Base64 encoded content for files
  encoding?: 'base64';
}

const getRepoDetails = (repoUrl: string): { owner: string; repo: string; path?: string, ref?: string } => {
  const url = new URL(repoUrl);
  if (url.hostname !== 'github.com') {
    throw new Error('Invalid GitHub URL. Must be a github.com URL.');
  }
  const pathParts = url.pathname.slice(1).split('/');
  const owner = pathParts[0];
  const repo = pathParts[1];

  if (!owner || !repo) {
    throw new Error('Invalid GitHub URL format. Could not extract owner and repo.');
  }
  
  let contentPath = '';
  let ref: string | undefined = undefined;

  // Handles URLs like /owner/repo/tree/branch/path/to/content
  if (pathParts.length > 3 && pathParts[2] === 'tree') {
    ref = pathParts[3];
    contentPath = pathParts.slice(4).join('/');
  } 
  // Handles URLs like /owner/repo/some/path (implies default branch)
  // Excludes /owner/repo/blob/branch/path to avoid misinterpreting blob as content path
  else if (pathParts.length > 2 && pathParts[2] !== 'tree' && pathParts[2] !== 'blob') { 
    contentPath = pathParts.slice(2).join('/');
  }
  // If URL is just /owner/repo, contentPath remains '', ref is undefined (implies default branch root)
  // If URL is /owner/repo/tree/branch, contentPath remains '', ref is 'branch' (implies branch root)
  // If URL is /owner/repo/blob/branch/file, contentPath and ref are not set here, let main logic handle with full path.

  return { owner, repo, path: contentPath || undefined, ref };
};


const fetchGitHubApi = async <T,>(apiUrl: string, token?: string | null): Promise<T> => {
  const headers: HeadersInit = {
    'Accept': 'application/vnd.github.v3+json',
  };
  if (token) {
    headers['Authorization'] = `token ${token}`;
  }
  const response = await fetch(apiUrl, { headers });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(`GitHub API Error (${response.status} for ${apiUrl}): ${errorData.message || response.statusText}`);
  }
  return response.json() as Promise<T>;
};

const fetchFileContent = async (downloadUrl: string, token?: string | null): Promise<string> => {
    const headers: HeadersInit = {};
    if (token) {
        headers['Authorization'] = `token ${token}`;
    }
    const response = await fetch(downloadUrl, { headers });
    if (!response.ok) {
        throw new Error(`Failed to download file content from ${downloadUrl}: ${response.statusText}`);
    }
    return response.text();
};


const fetchRepoContentsRecursive = async (
  owner: string,
  repo: string,
  path: string = '', // Path relative to repo root, used for API calls
  ref: string | undefined,
  token: string | null | undefined,
  includePatterns: string[],
  excludePatterns: string[],
  maxFileSize: number,
  baseRepoPath: string // The initial path segment from the user's URL, relative to repo root
): Promise<FileData[]> => {
  let apiUrl = `${GITHUB_API_BASE_URL}/repos/${owner}/${repo}/contents/${path}`;
  if (ref) {
    apiUrl += `?ref=${ref}`;
  }
  
  // GitHub API returns single object for file, array for directory
  const rawContents = await fetchGitHubApi<GitHubContent | GitHubContent[]>(apiUrl, token);
  const contentsArray = Array.isArray(rawContents) ? rawContents : [rawContents];
  
  let files: FileData[] = [];

  for (const item of contentsArray) {
    // item.path is always the full path from the repository root.
    // displayPath is the path relative to the baseRepoPath (the folder user specified in URL).
    let displayPath = item.path;
    if (baseRepoPath && item.path.startsWith(baseRepoPath)) {
      // Make path relative to baseRepoPath
      displayPath = item.path.substring(baseRepoPath.length).replace(/^\//, '');
    } else if (!baseRepoPath) {
      // If baseRepoPath is empty (repo root), displayPath is same as item.path
      displayPath = item.path;
    } else {
        // item.path does not start with baseRepoPath, this shouldn't happen if API call path is correct.
        // Or if baseRepoPath itself is a file, and item.path is that file.
        // If baseRepoPath is "foo/file.txt" and item.path is "foo/file.txt", displayPath becomes ""
        // So, if displayPath is empty and it's a file, use item.name
    }

    // If displayPath ended up empty (e.g. baseRepoPath was the file itself), use item's name.
    if (displayPath === '' && item.type === 'file') {
      displayPath = item.name;
    }
    
    // If displayPath is still empty (e.g. baseRepoPath was a directory and item.path matched it exactly), skip.
    // This item is the directory itself, not a file to be added. Its contents are iterated if it's a dir type.
    if (displayPath === '' && item.type === 'dir') {
        continue;
    }


    // Exclusion check: patterns apply to full path from repo root (item.path) AND path relative to user's specified dir (displayPath)
    const isExcluded = excludePatterns.some(pattern => minimatch(item.path, pattern, { dot: true })) ||
                       (displayPath !== item.path && excludePatterns.some(pattern => minimatch(displayPath, pattern, { dot: true })));
    
    if (isExcluded) {
      console.log(`Excluding ${item.path} (display: ${displayPath}) due to exclude patterns.`);
      continue;
    }

    if (item.type === 'dir') {
      // For directories, recurse using item.path (full path from repo root)
      files = files.concat(
        await fetchRepoContentsRecursive(owner, repo, item.path, ref, token, includePatterns, excludePatterns, maxFileSize, baseRepoPath)
      );
    } else if (item.type === 'file') {
      // Inclusion check: patterns apply to item name (basename) AND path relative to user's specified dir (displayPath)
      const isIncluded = includePatterns.length === 0 || 
                         includePatterns.some(pattern => minimatch(item.name, pattern, { dot: true })) ||
                         (displayPath !== item.name && includePatterns.some(pattern => minimatch(displayPath, pattern, { dot: true })));
      
      if (!isIncluded) {
        console.log(`Skipping ${item.path} (display: ${displayPath}, name: ${item.name}) as it does not match include patterns.`);
        continue;
      }
      if (item.size > maxFileSize) {
        console.warn(`Skipping file ${item.path} (display: ${displayPath}) due to size: ${item.size} > ${maxFileSize}`);
        continue;
      }

      try {
        let content: string;
        if (item.download_url) {
            content = await fetchFileContent(item.download_url, token);
        } else if (item.content && item.encoding === 'base64') {
            content = atob(item.content);
        } else {
            const fileDetail = await fetchGitHubApi<GitHubContent>(item.url, token); // Refetch full file details
            if (fileDetail.content && fileDetail.encoding === 'base64') {
                content = atob(fileDetail.content);
            } else {
                 console.warn(`Could not retrieve content for ${item.path} (display: ${displayPath})`);
                 continue;
            }
        }
        // Ensure displayPath is not empty for the pushed file. If it was, item.name should have been used.
        // This check is a safeguard.
        const finalPathForFileData = (displayPath === '' && item.name) ? item.name : displayPath;
        if (finalPathForFileData) { // Do not add files with empty paths
             files.push({ path: finalPathForFileData, content });
        } else {
            console.warn(`Skipping file with empty resolved path: ${item.path}`);
        }

      } catch (error) {
        console.error(`Error fetching content for ${item.path} (display: ${displayPath}):`, error);
      }
    }
  }
  return files;
};

export const githubService = {
  fetchRepoFiles: async (
    repoUrl: string,
    token: string | null | undefined,
    includePatterns: string[], // Original user patterns
    excludePatterns: string[], // Original user patterns
    maxFileSize: number
  ): Promise<FileData[]> => {
    // basePathFromUrl is path part of the user's URL, e.g. "src/components" or "" if repo root.
    const { owner, repo, path: basePathFromUrl, ref } = getRepoDetails(repoUrl);
    
    // Initial API call path is basePathFromUrl (or "" for repo root).
    // baseRepoPath for recursive calls is also basePathFromUrl, used for calculating relative displayPaths.
    return fetchRepoContentsRecursive(owner, repo, basePathFromUrl, ref, token, includePatterns, excludePatterns, maxFileSize, basePathFromUrl || '');
  },

  readUploadedFiles: async (fileList: FileList): Promise<FileData[]> => {
    const filesData: FileData[] = [];
    for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        const content = await file.text();
        const path = (file as any).webkitRelativePath || file.name;
        filesData.push({ path, content });
    }
    return filesData;
  }
};

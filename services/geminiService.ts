import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { GEMINI_MODEL_NAME, LLM_CACHE_KEY, CACHE_EXPIRY_MS } from '../constants';
import { 
  type FileData, 
  type Abstraction, 
  type RelationshipData, 
  type Language, 
  type ChapterResult, 
  type ProjectAnalysis, 
  type ChapterContextInfo, 
  type LLMCacheEntry,
  type TutorialOutputData
} from '../types';

// Constants for retry mechanism
const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 1000; // 1 second

// Helper for localStorage cache
const getCache = (): Record<string, LLMCacheEntry> => {
  try {
    const cachedData = localStorage.getItem(LLM_CACHE_KEY);
    if (cachedData) {
      const parsed = JSON.parse(cachedData) as Record<string, LLMCacheEntry>;
      // Filter out expired entries
      const now = Date.now();
      const validCache: Record<string, LLMCacheEntry> = {};
      for (const key in parsed) {
        if (parsed[key].timestamp + CACHE_EXPIRY_MS > now) {
          validCache[key] = parsed[key];
        }
      }
      return validCache;
    }
  } catch (error) {
    console.error("Error reading LLM cache:", error);
  }
  return {};
};

const setCache = (cache: Record<string, LLMCacheEntry>): void => {
  try {
    localStorage.setItem(LLM_CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.error("Error saving LLM cache:", error);
  }
};


const callGeminiApi = async <T,>(prompt: string, useCache: boolean, isJsonOutput: boolean = true): Promise<T> => {
  if (useCache) {
    const cache = getCache();
    if (cache[prompt]) {
      console.log("Using cached LLM response for prompt:", prompt.substring(0,100) + "...");
      return cache[prompt].response as T;
    }
  }

  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("Gemini API key (process.env.API_KEY) is not set.");
  }
  const ai = new GoogleGenAI({ apiKey });

  let retries = 0;
  let backoffMs = INITIAL_BACKOFF_MS;

  while (retries <= MAX_RETRIES) {
    try {
      console.log(`Calling Gemini API (attempt ${retries + 1}) with prompt:`, prompt.substring(0,100) + "...");

      const response: GenerateContentResponse = await ai.models.generateContent({
        model: GEMINI_MODEL_NAME,
        contents: prompt,
        config: isJsonOutput ? { responseMimeType: "application/json" } : {}
      });
      
      let responseText = response.text;
      console.log("Raw Gemini response:", responseText.substring(0,200) + "...");

      if (isJsonOutput) {
        // Clean potential markdown fences for JSON
        const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
        const match = responseText.match(fenceRegex);
        if (match && match[2]) {
          responseText = match[2].trim();
        }
      }

      try {
        const parsedResponse = isJsonOutput ? JSON.parse(responseText) : responseText;
        
        if (useCache) {
          const cache = getCache();
          cache[prompt] = { prompt, response: parsedResponse, timestamp: Date.now() };
          setCache(cache);
        }
        return parsedResponse as T;
      } catch (e) {
        console.error("Failed to parse LLM JSON response:", e, "Raw text:", responseText);
        throw new Error(`Failed to parse LLM response. Raw: ${responseText.substring(0, 200)}...`);
      }
    } catch (error: any) {
      // The Gemini SDK might throw an error object that includes details.
      // We'll check if it's a rate limit error (often indicated by status code 429).
      // The SDK might abstract the actual HTTP status code, so we look for common message patterns.
      const errorMessage = error.message?.toLowerCase() || '';
      const isRateLimitError = errorMessage.includes('rate limit') || errorMessage.includes('quota') || errorMessage.includes('429');

      if (isRateLimitError && retries < MAX_RETRIES) {
        console.warn(`Gemini API rate limit hit. Retrying in ${backoffMs}ms... (Attempt ${retries + 1}/${MAX_RETRIES})`);
        await new Promise(resolve => setTimeout(resolve, backoffMs));
        retries++;
        backoffMs *= 2; // Exponential backoff
      } else {
        console.error("Gemini API call failed after retries or for a non-retriable error:", error);
        if (isRateLimitError) {
          throw new Error(`Exceeded Gemini API rate limits after ${MAX_RETRIES + 1} attempts. Please try again later or check your API quota. Original error: ${error.message}`);
        }
        throw error; // Re-throw other errors
      }
    }
  }
  // Should not be reached if MAX_RETRIES is handled correctly above
  throw new Error("Gemini API call failed after maximum retries.");
};

const createFileListString = (filesData: FileData[]): string => {
  return filesData.map((file, index) => `- ${index} # ${file.path}`).join('\n');
};

const createContextString = (filesData: FileData[]): string => {
  return filesData.map((file, index) => `--- File Index ${index}: ${file.path} ---\n${file.content}\n\n`).join('');
};

const getFileContentForIndices = (filesData: FileData[], indices: number[]): { path: string, content: string }[] => {
    return indices
        .map(index => filesData[index])
        .filter(file => file !== undefined) // Filter out undefined if an index is out of bounds
        .map(file => ({ path: file.path, content: file.content }));
};


export const geminiService = {
  identifyAbstractions: async (
    filesData: FileData[],
    projectName: string,
    language: Language,
    maxAbstractions: number,
    useCache: boolean
  ): Promise<Abstraction[]> => {
    const context = createContextString(filesData);
    const fileListingForPrompt = createFileListString(filesData);
    
    const languageInstruction = language.toLowerCase() !== 'english' 
        ? `IMPORTANT: Generate the "name" and "description" for each abstraction in **${language.charAt(0).toUpperCase() + language.slice(1)}** language. Do NOT use English for these fields.`
        : '';
    const nameLangHint = language.toLowerCase() !== 'english' ? ` (in ${language.charAt(0).toUpperCase() + language.slice(1)})` : '';
    const descLangHint = language.toLowerCase() !== 'english' ? ` (in ${language.charAt(0).toUpperCase() + language.slice(1)})` : '';

    const prompt = `
For the project "${projectName}":

Codebase Context:
${context}

${languageInstruction}
Analyze the codebase context. Identify the top 5-${maxAbstractions} core most important abstractions to help those new to the codebase.

For each abstraction, provide:
1. A concise "name"${nameLangHint}.
2. A beginner-friendly "description" explaining what it is with a simple analogy, in around 100 words${descLangHint}.
3. A list of relevant "file_indices" (integers only) using the provided file indices.

List of file indices and paths present in the context:
${fileListingForPrompt}

Format the output as a JSON array of objects. Each object should have keys "name" (string), "description" (string), and "file_indices" (array of numbers). Example:
[
  {
    "name": "Query Processing${nameLangHint}",
    "description": "Explains what the abstraction does. It's like a central dispatcher routing requests.${descLangHint}",
    "file_indices": [0, 3]
  },
  {
    "name": "Data Storage${nameLangHint}",
    "description": "Handles how data is stored and retrieved. Think of it as the library's shelving system.${descLangHint}",
    "file_indices": [1, 5]
  }
]
`;
    const result = await callGeminiApi<Abstraction[]>(prompt, useCache);
    return result.map((abs, index) => ({ ...abs, index })); // Add original index
  },

  analyzeRelationships: async (
    abstractions: Abstraction[],
    filesData: FileData[],
    projectName: string,
    language: Language,
    useCache: boolean
  ): Promise<ProjectAnalysis> => {
    let context = "Identified Abstractions:\n";
    const abstractionInfoForPrompt: string[] = [];
    const allRelevantFileIndices = new Set<number>();

    abstractions.forEach((abstr, i) => {
      const fileIndicesStr = abstr.file_indices.join(", ");
      context += `- Index ${i}: ${abstr.name} (Relevant file indices: [${fileIndicesStr}])\n  Description: ${abstr.description}\n`;
      abstractionInfoForPrompt.push(`${i} # ${abstr.name}`);
      abstr.file_indices.forEach(idx => allRelevantFileIndices.add(idx));
    });

    context += "\nRelevant File Snippets (Referenced by Index and Path):\n";
    const relevantFilesContent = getFileContentForIndices(filesData, Array.from(allRelevantFileIndices));
    relevantFilesContent.forEach(file => {
        const originalIndex = filesData.findIndex(f => f.path === file.path); // Find original index for display
        context += `--- File Index ${originalIndex}: ${file.path} ---\n${file.content.substring(0, 500)}...\n\n`; // Limit content for brevity
    });
    
    const languageInstruction = language.toLowerCase() !== 'english' 
        ? `IMPORTANT: Generate the "summary" and relationship "label" fields in **${language.charAt(0).toUpperCase() + language.slice(1)}** language.`
        : '';
    const langHint = language.toLowerCase() !== 'english' ? ` (in ${language.charAt(0).toUpperCase() + language.slice(1)})` : '';
    const listLangNote = language.toLowerCase() !== 'english' ? ` (Names might be in ${language.charAt(0).toUpperCase() + language.slice(1)})` : '';


    const prompt = `
Based on the following abstractions and relevant code snippets from the project "${projectName}":

List of Abstraction Indices and Names${listLangNote}:
${abstractionInfoForPrompt.join('\n')}

Context (Abstractions, Descriptions, Code Snippets):
${context}

${languageInstruction}
Please provide:
1. A high-level "summary" of the project's main purpose and functionality in a few beginner-friendly sentences${langHint}. Use markdown formatting with **bold** and *italic* text to highlight important concepts.
2. A list ("details") describing the key interactions between these abstractions. For each relationship, specify:
    - "from": Index of the source abstraction (integer).
    - "to": Index of the target abstraction (integer).
    - "label": A brief label for the interaction **in just a few words**${langHint} (e.g., "Manages", "Inherits", "Uses").
    Ideally the relationship should be backed by one abstraction calling or passing parameters to another.
    Simplify the relationship and exclude non-important ones.
IMPORTANT: Make sure EVERY abstraction is involved in at least ONE relationship (either as source or target). Each abstraction index must appear at least once across all relationships.

Format the output as a JSON object with keys "summary" (string) and "details" (array of objects). Example:
{
  "summary": "A brief, simple explanation of the project${langHint}.\\nCan span multiple lines with **bold** and *italic* for emphasis.",
  "details": [
    { "from": 0, "to": 1, "label": "Manages${langHint}" },
    { "from": 2, "to": 0, "label": "Provides config${langHint}" }
  ]
}
`;
    return callGeminiApi<ProjectAnalysis>(prompt, useCache);
  },

  orderChapters: async (
    abstractions: Abstraction[],
    relationshipsData: ProjectAnalysis,
    projectName: string,
    language: Language,
    useCache: boolean
  ): Promise<number[]> => {
    const abstractionListing = abstractions.map((a, i) => `- ${i} # ${a.name}`).join('\n');
    let context = `Project Summary:\n${relationshipsData.summary}\n\n`;
    context += "Relationships (Indices refer to abstractions above):\n";
    relationshipsData.details.forEach(rel => {
      const fromName = abstractions[rel.from]?.name || `Unknown Abstraction ${rel.from}`;
      const toName = abstractions[rel.to]?.name || `Unknown Abstraction ${rel.to}`;
      context += `- From ${rel.from} (${fromName}) to ${rel.to} (${toName}): ${rel.label}\n`;
    });

    const listLangNote = language.toLowerCase() !== 'english' ? ` (Names might be in ${language.charAt(0).toUpperCase() + language.slice(1)})` : '';

    const prompt = `
Given the following project abstractions and their relationships for the project "${projectName}":

Abstractions (Index # Name)${listLangNote}:
${abstractionListing}

Context about relationships and project summary:
${context}

If you are going to make a tutorial for "${projectName}", what is the best order to explain these abstractions, from first to last?
Ideally, first explain those that are the most important or foundational, perhaps user-facing concepts or entry points. Then move to more detailed, lower-level implementation details or supporting concepts.

Output the ordered list of abstraction indices (numbers only).

Format the output as a JSON array of numbers. Example:
[2, 0, 1]
`;
    return callGeminiApi<number[]>(prompt, useCache);
  },

  writeChapter: async (
    currentAbstraction: Abstraction,
    allFilesData: FileData[],
    projectName: string,
    chapterNum: number,
    fullChapterListing: string, // Markdown formatted list of all chapters with links
    chapterFilenamesMap: Record<number, ChapterContextInfo>, // mapping from abstraction index to filename info
    prevChapter: ChapterContextInfo | undefined,
    nextChapter: ChapterContextInfo | undefined,
    previousChaptersSummaries: string[], // Array of Markdown content of previous chapters
    language: Language,
    useCache: boolean
  ): Promise<string> => {
    const relatedFileSnippets = getFileContentForIndices(allFilesData, currentAbstraction.file_indices)
        .map(file => `--- File: ${file.path} ---\n${file.content.substring(0,1000)}...\n\n`) // Limit content for brevity
        .join('');

    const previousChaptersContext = previousChaptersSummaries.length > 0
        ? "Context from previous chapters (summaries/key points):\n" + previousChaptersSummaries.map((s, i) => `Chapter ${i+1} Summary:\n${s.substring(0, 300)}...\n---\n`).join('')
        : "This is the first chapter.";

    const langCap = language.charAt(0).toUpperCase() + language.slice(1);
    const languageInstruction = language.toLowerCase() !== 'english' 
        ? `IMPORTANT: Write this ENTIRE tutorial chapter in **${langCap}**. Some input context (like concept name, description, chapter list, previous summary) might already be in ${langCap}, but you MUST translate ALL other generated content including explanations, examples, technical terms, and potentially code comments into ${langCap}. DO NOT use English anywhere except in code syntax, required proper nouns, or when specified. The entire output MUST be in ${langCap}.`
        : '';
    const notes = language.toLowerCase() !== 'english' ? {
        conceptDetails: ` (Note: Provided in ${langCap})`,
        structure: ` (Note: Chapter names might be in ${langCap})`,
        prevSummary: ` (Note: This summary might be in ${langCap})`,
        instructionLang: ` (in ${langCap})`,
        mermaidLang: ` (Use ${langCap} for labels/text if appropriate)`,
        codeComment: ` (Translate to ${langCap} if possible, otherwise keep minimal English for clarity)`,
        linkLang: ` (Use the ${langCap} chapter title from the structure above)`,
        tone: ` (appropriate for ${langCap} readers)`
    } : { conceptDetails: '', structure: '', prevSummary: '', instructionLang: '', mermaidLang: '', codeComment: '', linkLang: '', tone: ''};


    let transitionIntro = "";
    if (prevChapter && chapterNum > 1) {
        transitionIntro = `In the previous chapter, we explored [${prevChapter.name}](${prevChapter.filename}). Now, let's dive into ${currentAbstraction.name}.`;
        if (language.toLowerCase() !== 'english') transitionIntro += notes.instructionLang;
    }

    let transitionOutro = "";
    if (nextChapter) {
        transitionOutro = `In the next chapter, we will look at [${nextChapter.name}](${nextChapter.filename}).`;
         if (language.toLowerCase() !== 'english') transitionOutro += notes.instructionLang;
    }


    const prompt = `
${languageInstruction}
Write a very beginner-friendly tutorial chapter (in Markdown format) for the project "${projectName}" about the concept: "${currentAbstraction.name}". This is Chapter ${chapterNum}.

Concept Details${notes.conceptDetails}:
- Name: ${currentAbstraction.name}
- Description:
${currentAbstraction.description}

Complete Tutorial Structure (for linking)${notes.structure}:
${fullChapterListing}

Context from previous chapters${notes.prevSummary}:
${previousChaptersContext}

Relevant Code Snippets (Code itself remains unchanged, show snippets from these files):
${relatedFileSnippets || "No specific code snippets directly associated with this abstraction's definition, but it might interact with code from other files."}

Instructions for the chapter (Generate content in ${langCap} unless specified otherwise):
- Start with a clear heading (e.g., \`# Chapter ${chapterNum}: ${currentAbstraction.name}\`). Use the provided concept name.
${transitionIntro ? `- ${transitionIntro}\n` : ''}
- Begin with a high-level motivation explaining what problem this abstraction solves${notes.instructionLang}. Start with a central use case as a concrete example. The whole chapter should guide the reader to understand how to solve this use case. Make it very minimal and friendly to beginners.
- If the abstraction is complex, break it down into key concepts. Explain each concept one-by-one in a very beginner-friendly way${notes.instructionLang}.
- Explain how to use this abstraction to solve the use case${notes.instructionLang}. Give example inputs and outputs for code snippets (if the output isn't values, describe at a high level what will happen${notes.instructionLang}).
- Each code block should be BELOW 10 lines! If longer code blocks are needed, break them down into smaller pieces and walk through them one-by-one. Aggressively simplify the code to make it minimal. Use comments${notes.codeComment} to skip non-important implementation details. Each code block should have a beginner friendly explanation right after it${notes.instructionLang}.
- Describe the internal implementation to help understand what's under the hood${notes.instructionLang}. First provide a non-code or code-light walkthrough on what happens step-by-step when the abstraction is called${notes.instructionLang}. It's recommended to use a simple sequenceDiagram with a dummy example - keep it minimal with at most 5 participants to ensure clarity. If participant name has space, use: \`participant "Query Processor" as QP\`. ${notes.mermaidLang}.
- Then dive deeper into code for the internal implementation with references to files. Provide example code blocks, but make them similarly simple and beginner-friendly. Explain${notes.instructionLang}.
- IMPORTANT: When you need to refer to other core abstractions covered in other chapters, ALWAYS use proper Markdown links like this: \`[Chapter Title](filename.md)\`. Use the Complete Tutorial Structure above to find the correct filename and the chapter title${notes.linkLang}. Translate the surrounding text.
- Use mermaid diagrams to illustrate complex concepts (\`\`\`mermaid \`\`\` format). ${notes.mermaidLang}.
- Heavily use analogies and examples throughout${notes.instructionLang} to help beginners understand.
- End the chapter with a brief conclusion that summarizes what was learned${notes.instructionLang}.
${transitionOutro ? `- ${transitionOutro}\n` : ''}
- Ensure the tone is welcoming and easy for a newcomer to understand${notes.tone}.
- Output *only* the Markdown content for this chapter. Do not include any other text or preamble.

Now, directly provide a super beginner-friendly Markdown output (DON'T need \`\`\`markdown\`\`\` tags):
`;
    // For chapter content, we expect raw markdown, not JSON.
    return callGeminiApi<string>(prompt, useCache, false);
  },

  combineTutorial: (
    projectName: string,
    repoUrl: string, // Or source description
    relationshipsData: ProjectAnalysis,
    chapterOrder: number[],
    abstractions: Abstraction[],
    chaptersContent: ChapterResult[]
  ): TutorialOutputData => {
    let mermaidLines = ["flowchart TD"];
    abstractions.forEach((abstr, i) => {
      const nodeId = `A${i}`;
      const sanitizedName = abstr.name.replace(/"/g, ""); // Basic sanitize for mermaid label
      mermaidLines.push(`    ${nodeId}["${nodeId} (${sanitizedName})"]`);
    });
    relationshipsData.details.forEach(rel => {
      const fromNodeId = `A${rel.from}`;
      const toNodeId = `A${rel.to}`;
      const edgeLabel = rel.label.replace(/"/g, "").replace(/\n/g, " ");
      mermaidLines.push(`    ${fromNodeId} -- "${edgeLabel}" --> ${toNodeId}`);
    });
    const mermaidDiagram = mermaidLines.join('\n');

    let indexMdContent = `# Tutorial: ${projectName}\n\n`;
    indexMdContent += `${relationshipsData.summary}\n\n`;
    indexMdContent += `**Source:** ${repoUrl}\n\n`;
    indexMdContent += "## Project Abstraction Map\n\n";
    indexMdContent += "```mermaid\n" + mermaidDiagram + "\n```\n\n";
    indexMdContent += `## Chapters\n\n`;

    const finalChaptersWithAttribution: ChapterResult[] = [];

    chapterOrder.forEach((abstractionIndex, i) => {
        const chapterMeta = chaptersContent.find(c => {
            // This assumes chaptersContent is ordered correctly or filenames are unique enough
            // A more robust link would be if writeChapter returned the abstractionIndex
            const abstractionName = abstractions[abstractionIndex].name;
            const safeName = abstractionName.replace(/[^a-zA-Z0-9_.-]/g, '_').toLowerCase();
            const expectedFilename = `${(i + 1).toString().padStart(2, '0')}_${safeName}.md`;
            return c.filename === expectedFilename;
        });
      
        if (chapterMeta) {
            const abstractionName = abstractions[abstractionIndex].name;
            indexMdContent += `${i + 1}. [${abstractionName}](${chapterMeta.filename})\n`;
            
            let chapterContentWithAttribution = chapterMeta.content;
            if (!chapterContentWithAttribution.endsWith('\n\n')) chapterContentWithAttribution += '\n\n';
            chapterContentWithAttribution += `---\n\n*Generated by AI Codebase Explanation Tool.*`;
            finalChaptersWithAttribution.push({ ...chapterMeta, content: chapterContentWithAttribution });
        }
    });
    
    indexMdContent += `\n\n---\n\n*Generated by AI Codebase Explanation Tool.*`;

    return { indexMdContent, chapters: finalChaptersWithAttribution, mermaidDiagram };
  }
};

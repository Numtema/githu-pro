
import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { ApiKeyNotifier } from './components/ApiKeyNotifier';
import { RepoInputForm, type RepoInputFormState } from './components/RepoInputForm';
import { ProgressStepper, type Step } from './components/ProgressStepper';
import { TutorialOutput } from './components/TutorialOutput';
import { LoadingSpinner } from './components/LoadingSpinner';
import { GithubIcon, InfoIcon, AlertTriangleIcon } from './components/Icons';

import { geminiService } from './services/geminiService';
import { githubService } from './services/githubService';
import { type FileData, type Abstraction, type RelationshipData, type ChapterResult, type TutorialOutputData, ProcessingStep, type Language, DEFAULT_INCLUDE_PATTERNS_STRING, DEFAULT_EXCLUDE_PATTERNS_STRING } from './types';
import { parseFileContent } from './utils/fileUtils';

const App: React.FC = () => {
  const [apiKeyExists, setApiKeyExists] = useState<boolean | null>(null);
  const [currentStep, setCurrentStep] = useState<ProcessingStep>(ProcessingStep.IDLE);
  const [userInput, setUserInput] = useState<RepoInputFormState | null>(null);
  
  const [filesData, setFilesData] = useState<FileData[]>([]);
  const [abstractions, setAbstractions] = useState<Abstraction[]>([]);
  const [projectSummary, setProjectSummary] = useState<string>('');
  const [relationships, setRelationships] = useState<RelationshipData[]>([]);
  const [chapterOrder, setChapterOrder] = useState<number[]>([]);
  const [chaptersContent, setChaptersContent] = useState<ChapterResult[]>([]);
  
  const [tutorialOutput, setTutorialOutput] = useState<TutorialOutputData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progressMessage, setProgressMessage] = useState<string>('');

  useEffect(() => {
    // This is a proxy for checking process.env.API_KEY. In a real build, 
    // process.env.API_KEY would be replaced by its value or undefined.
    // For this environment, we'll simulate it.
    // In a deployed app, this check might be more about feature flagging or UI hints.
    const key = process.env.API_KEY;
    setApiKeyExists(!!key && key !== "YOUR_API_KEY_HERE" && key.length > 10);
  }, []);

  const resetState = () => {
    setCurrentStep(ProcessingStep.IDLE);
    setFilesData([]);
    setAbstractions([]);
    setProjectSummary('');
    setRelationships([]);
    setChapterOrder([]);
    setChaptersContent([]);
    setTutorialOutput(null);
    setError(null);
    setProgressMessage('');
  };

  const handleFormSubmit = async (data: RepoInputFormState) => {
    resetState();
    setUserInput(data);
    setCurrentStep(ProcessingStep.FETCHING_FILES);
    setProgressMessage('Fetching files...');

    let fetchedFiles: FileData[] = [];
    try {
      if (data.sourceType === 'github') {
        if (!data.repoUrl) throw new Error('GitHub URL is required.');
        fetchedFiles = await githubService.fetchRepoFiles(
          data.repoUrl,
          data.githubToken,
          data.includePatterns.split(',').map(p => p.trim()).filter(Boolean),
          data.excludePatterns.split(',').map(p => p.trim()).filter(Boolean),
          data.maxFileSize
        );
      } else if (data.sourceType === 'paste') {
         if (!data.pastedCode) throw new Error('Pasted code is required.');
         fetchedFiles = parseFileContent(data.pastedCode);
      } else { // upload
        if (!data.uploadedFiles || data.uploadedFiles.length === 0) throw new Error('No files uploaded.');
        fetchedFiles = await githubService.readUploadedFiles(data.uploadedFiles); // Re-use similar logic or adapt
      }
      
      if (fetchedFiles.length === 0) {
        throw new Error('No files were fetched or processed. Check patterns and source.');
      }
      setFilesData(fetchedFiles);
      setProgressMessage(`${fetchedFiles.length} files fetched. Identifying abstractions...`);
      setCurrentStep(ProcessingStep.IDENTIFYING_ABSTRACTIONS);
    } catch (err) {
      console.error(err);
      setError((err as Error).message);
      setCurrentStep(ProcessingStep.ERROR);
      return;
    }
  };

  const runGenerationProcess = useCallback(async () => {
    if (!userInput || filesData.length === 0) return;

    try {
      if (currentStep === ProcessingStep.IDENTIFYING_ABSTRACTIONS) {
        const projectName = userInput.projectName || userInput.repoUrl?.split('/').pop() || 'Untitled Project';
        const identifiedAbstractions = await geminiService.identifyAbstractions(
          filesData,
          projectName,
          userInput.language,
          userInput.maxAbstractions,
          userInput.useCache
        );
        setAbstractions(identifiedAbstractions);
        setProgressMessage(`${identifiedAbstractions.length} abstractions identified. Analyzing relationships...`);
        setCurrentStep(ProcessingStep.ANALYZING_RELATIONSHIPS);
      } else if (currentStep === ProcessingStep.ANALYZING_RELATIONSHIPS) {
        const projectName = userInput.projectName || userInput.repoUrl?.split('/').pop() || 'Untitled Project';
        const analysisResult = await geminiService.analyzeRelationships(
          abstractions,
          filesData,
          projectName,
          userInput.language,
          userInput.useCache
        );
        setProjectSummary(analysisResult.summary);
        setRelationships(analysisResult.details);
        setProgressMessage('Relationships analyzed. Ordering chapters...');
        setCurrentStep(ProcessingStep.ORDERING_CHAPTERS);
      } else if (currentStep === ProcessingStep.ORDERING_CHAPTERS) {
        const projectName = userInput.projectName || userInput.repoUrl?.split('/').pop() || 'Untitled Project';
        const orderedIndices = await geminiService.orderChapters(
          abstractions,
          { summary: projectSummary, details: relationships },
          projectName,
          userInput.language,
          userInput.useCache
        );
        setChapterOrder(orderedIndices);
        setProgressMessage('Chapters ordered. Writing chapters...');
        setCurrentStep(ProcessingStep.WRITING_CHAPTERS);
      } else if (currentStep === ProcessingStep.WRITING_CHAPTERS) {
        const projectName = userInput.projectName || userInput.repoUrl?.split('/').pop() || 'Untitled Project';
        const writtenChapters: ChapterResult[] = [];
        const chapterFilenamesMap: Record<number, { num: number; name: string; filename: string }> = {};
        
        chapterOrder.forEach((absIdx, i) => {
            const abstractionName = abstractions[absIdx].name;
            const safeName = abstractionName.replace(/[^a-zA-Z0-9_.-]/g, '_').toLowerCase();
            chapterFilenamesMap[absIdx] = {
                num: i + 1,
                name: abstractionName,
                filename: `${(i + 1).toString().padStart(2, '0')}_${safeName}.md`
            };
        });

        const allChaptersListForPrompt = chapterOrder.map((absIdx, i) => {
            const chapInfo = chapterFilenamesMap[absIdx];
            return `${chapInfo.num}. [${chapInfo.name}](${chapInfo.filename})`;
        }).join('\n');


        for (let i = 0; i < chapterOrder.length; i++) {
          const abstractionIndex = chapterOrder[i];
          const abstractionDetails = abstractions[abstractionIndex];
          setProgressMessage(`Writing chapter ${i + 1} of ${chapterOrder.length}: ${abstractionDetails.name}...`);
          
          const prevChapterInfo = i > 0 ? chapterFilenamesMap[chapterOrder[i-1]] : undefined;
          const nextChapterInfo = i < chapterOrder.length - 1 ? chapterFilenamesMap[chapterOrder[i+1]] : undefined;

          const chapterContent = await geminiService.writeChapter(
            { ...abstractionDetails, index: abstractionIndex},
            filesData,
            projectName,
            i + 1,
            allChaptersListForPrompt,
            chapterFilenamesMap,
            prevChapterInfo,
            nextChapterInfo,
            chaptersContent.map(c => c.content), // summaries of previously written chapters
            userInput.language,
            userInput.useCache
          );
          writtenChapters.push({
            title: abstractionDetails.name,
            content: chapterContent,
            filename: chapterFilenamesMap[abstractionIndex].filename
          });
          setChaptersContent([...writtenChapters]);
        }
        setProgressMessage('All chapters written. Combining tutorial...');
        setCurrentStep(ProcessingStep.COMBINING_TUTORIAL);
      } else if (currentStep === ProcessingStep.COMBINING_TUTORIAL) {
        const projectName = userInput.projectName || userInput.repoUrl?.split('/').pop() || 'Untitled Project';
        const finalOutput = geminiService.combineTutorial(
          projectName,
          userInput.repoUrl || 'Local Files',
          { summary: projectSummary, details: relationships },
          chapterOrder,
          abstractions,
          chaptersContent
        );
        setTutorialOutput(finalOutput);
        setProgressMessage('Tutorial generated successfully!');
        setCurrentStep(ProcessingStep.DONE);
      }
    } catch (err) {
      console.error(err);
      setError((err as Error).message);
      setCurrentStep(ProcessingStep.ERROR);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, userInput, filesData, abstractions, projectSummary, relationships, chapterOrder, chaptersContent]); // Ensure all dependencies that trigger next steps are here

  useEffect(() => {
    if (currentStep > ProcessingStep.FETCHING_FILES && currentStep < ProcessingStep.DONE && currentStep !== ProcessingStep.ERROR) {
      runGenerationProcess();
    }
  }, [currentStep, runGenerationProcess]);


  const steps: Step[] = [
    { id: ProcessingStep.IDLE, name: 'Setup', icon: <GithubIcon className="w-5 h-5" /> },
    { id: ProcessingStep.FETCHING_FILES, name: 'Fetch Files', icon: <GithubIcon className="w-5 h-5" /> },
    { id: ProcessingStep.IDENTIFYING_ABSTRACTIONS, name: 'Identify Abstractions', icon: <InfoIcon className="w-5 h-5" /> },
    { id: ProcessingStep.ANALYZING_RELATIONSHIPS, name: 'Analyze Relationships', icon: <InfoIcon className="w-5 h-5" /> },
    { id: ProcessingStep.ORDERING_CHAPTERS, name: 'Order Chapters', icon: <InfoIcon className="w-5 h-5" /> },
    { id: ProcessingStep.WRITING_CHAPTERS, name: 'Write Chapters', icon: <InfoIcon className="w-5 h-5" /> },
    { id: ProcessingStep.COMBINING_TUTORIAL, name: 'Combine Tutorial', icon: <InfoIcon className="w-5 h-5" /> },
    { id: ProcessingStep.DONE, name: 'Done', icon: <InfoIcon className="w-5 h-5" /> },
  ];
  
  const isLoading = currentStep > ProcessingStep.IDLE && currentStep < ProcessingStep.DONE && currentStep !== ProcessingStep.ERROR;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <ApiKeyNotifier apiKeyExists={apiKeyExists} />
        
        {currentStep === ProcessingStep.IDLE && apiKeyExists && (
          <RepoInputForm onSubmit={handleFormSubmit} isLoading={isLoading} />
        )}

        {currentStep !== ProcessingStep.IDLE && (
          <div className="mt-8 p-6 bg-white rounded-xl shadow-xl">
            <ProgressStepper steps={steps} currentStepId={currentStep} />
            {progressMessage && (
              <div className="mt-4 text-center text-slate-600">
                <p>{progressMessage}</p>
              </div>
            )}
          </div>
        )}

        {isLoading && (
          <div className="mt-8 flex justify-center">
            <LoadingSpinner />
          </div>
        )}

        {currentStep === ProcessingStep.ERROR && error && (
          <div className="mt-8 p-6 bg-red-50 border border-red-200 rounded-lg shadow-md">
            <div className="flex items-center text-red-700">
              <AlertTriangleIcon className="w-6 h-6 mr-2" />
              <h2 className="text-xl font-semibold">Error</h2>
            </div>
            <p className="mt-2 text-red-600">{error}</p>
            <button
              onClick={resetState}
              className="mt-4 bg-gradient-to-r from-red-500 to-pink-500 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-transform transform hover:scale-105"
            >
              Try Again
            </button>
          </div>
        )}

        {currentStep === ProcessingStep.DONE && tutorialOutput && (
          <TutorialOutput output={tutorialOutput} projectName={userInput?.projectName || 'GeneratedTutorial'} />
        )}
      </main>
      <Footer />
    </div>
  );
};

export default App;


import React from 'react';

// Generic Icon Props
type IconProps = React.SVGProps<SVGSVGElement>;

export const GithubIcon: React.FC<IconProps> = (props) => (
  <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.5.49.09.665-.217.665-.483 0-.237-.008-.865-.013-1.702-2.782.602-3.369-1.343-3.369-1.343-.446-1.135-1.09-1.438-1.09-1.438-.89-.608.067-.595.067-.595.985.07 1.505.998 1.505.998.875 1.503 2.295 1.068 2.855.815.09-.633.342-1.068.62-1.313-2.176-.248-4.467-1.09-4.467-4.854 0-1.07.378-1.948 1.01-2.632-.1-.25-.443-1.248.097-2.6 0 0 .823-.264 2.695.996.782-.217 1.62-.327 2.45-.33.83.003 1.67.113 2.45.33 1.873-1.26 2.695-.996 2.695-.996.54 1.352.197 2.35.097 2.6.635.684 1.01 1.562 1.01 2.632 0 3.775-2.295 4.596-4.475 4.84.35.308.66.915.66 1.842 0 1.33-.012 2.404-.012 2.73 0 .268.175.575.67.48C19.135 20.193 22 16.437 22 12.017 22 6.484 17.523 2 12 2Z" clipRule="evenodd" />
  </svg>
);

export const CodeBracketSquareIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 9.75L16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
  </svg>
);

export const CheckCircleIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export const ExclamationTriangleIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
  </svg>
);

export const ArrowRightIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
  </svg>
);

export const DocumentTextIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
  </svg>
);

export const SparklesIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L1.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.25 12L17 13.75l-1.25-1.75L13.75 12l1.75-1.25L17 8.75l1.25 1.75L20.25 12l-1.75 1.25z"/>
  </svg>
);

export const CogIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12a7.5 7.5 0 0015 0m-15 0a7.5 7.5 0 1115 0m-15 0H3m1.5 0H21m-1.5 0H5.25m0 0A7.465 7.465 0 0112 4.5a7.464 7.464 0 016.75 7.5m-13.5 0A7.465 7.465 0 0012 19.5a7.464 7.464 0 006.75-7.5m-13.5 0H3m1.5 0H21m-1.5 0H5.25M9 12l2.25 2.25L15 9.75M21 12c0 2.22-.716 4.28-1.906 5.955M12 4.5A7.464 7.464 0 0118.75 12c0 .907-.163 1.775-.458 2.576M21 12a8.955 8.955 0 00-2.345-5.938M3 12c0-2.22.716-4.28 1.906-5.955M12 19.5a7.464 7.464 0 01-6.75-7.5c0-.907.163-1.775.458-2.576M3 12a8.955 8.955 0 012.345-5.938" />
    </svg>
);

export const InfoIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.25-.25L12 11.25l.25-.25L12.5 11.25l.25-.25L13 11.25l.25-.25L13.5 11.25l.25-.25L14 11.25l.25-.25L14.5 11.25l.25-.25L15 11.25l.25-.25L15.5 11.25l.25-.25L16 11.25l.25-.25L16.5 11.25l.25-.25L17 11.25" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.25.25L12 11.25l.25.25L12.5 11.25l.25.25L13 11.25l.25.25L13.5 11.25l.25.25L14 11.25l.25.25L14.5 11.25l.25.25L15 11.25l.25.25L15.5 11.25l.25.25L16 11.25l.25.25L16.5 11.25l.25.25L17 11.25" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
  </svg>
);

export const AlertTriangleIcon: React.FC<IconProps> = ExclamationTriangleIcon; // Alias

export const CheckIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
);

export const DownloadIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
  </svg>
);

export const ChevronDownIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
  </svg>
);

export const ChevronUpIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
  </svg>
);

export const CloudArrowUpIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.338 0 4.5 4.5 0 01-1.41 8.775H6.75z" />
  </svg>
);


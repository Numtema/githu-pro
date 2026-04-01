
import React from 'react';

export const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex items-center justify-center space-x-2">
      <div className="w-5 h-5 rounded-full animate-pulse bg-sky-500"></div>
      <div className="w-5 h-5 rounded-full animate-pulse bg-teal-500 delay-200"></div>
      <div className="w-5 h-5 rounded-full animate-pulse bg-emerald-500 delay-400"></div>
      <span className="ml-3 text-slate-600 font-medium">Processing...</span>
    </div>
  );
};

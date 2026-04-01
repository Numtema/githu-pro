
import React from 'react';
import { APP_NAME } from '../constants';
import { CodeBracketSquareIcon } from './Icons';

export const Header: React.FC = () => {
  return (
    <header className="bg-gradient-to-r from-slate-800 to-slate-900 text-white shadow-lg">
      <div className="container mx-auto px-4 py-5 flex items-center">
        <CodeBracketSquareIcon className="w-10 h-10 mr-3 text-teal-400" />
        <h1 className="text-3xl font-bold tracking-tight">{APP_NAME}</h1>
      </div>
    </header>
  );
};

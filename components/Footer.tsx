
import React from 'react';
import { FOOTER_TEXT } from '../constants';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-800 text-slate-400 py-6 text-center">
      <div className="container mx-auto px-4">
        <p>&copy; {new Date().getFullYear()} {FOOTER_TEXT}. All rights reserved.</p>
        <p className="text-sm mt-1">AI-powered codebase understanding.</p>
      </div>
    </footer>
  );
};

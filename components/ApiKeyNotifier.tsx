
import React from 'react';
import { CheckCircleIcon, ExclamationTriangleIcon } from './Icons';

interface ApiKeyNotifierProps {
  apiKeyExists: boolean | null;
}

export const ApiKeyNotifier: React.FC<ApiKeyNotifierProps> = ({ apiKeyExists }) => {
  if (apiKeyExists === null) {
    return (
      <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-lg shadow animate-pulse">
        <p className="text-slate-600">Checking API Key configuration...</p>
      </div>
    );
  }

  return (
    <div className={`mb-6 p-4 border rounded-lg shadow-md ${apiKeyExists ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-300'}`}>
      <div className="flex items-center">
        {apiKeyExists ? (
          <CheckCircleIcon className="w-6 h-6 mr-3 text-green-600" />
        ) : (
          <ExclamationTriangleIcon className="w-6 h-6 mr-3 text-amber-600" />
        )}
        <div>
          <h3 className={`text-lg font-semibold ${apiKeyExists ? 'text-green-800' : 'text-amber-800'}`}>
            Gemini API Key
          </h3>
          {apiKeyExists ? (
            <p className="text-green-700">API Key detected. You're ready to generate tutorials!</p>
          ) : (
            <p className="text-amber-700">
              API Key not detected or seems invalid. Please ensure the <code className="bg-amber-200 text-amber-900 px-1 py-0.5 rounded text-sm">process.env.API_KEY</code> environment variable is set correctly with your Gemini API Key.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

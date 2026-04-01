
import React from 'react';
import { ProcessingStep } from '../types';
import { CheckIcon } from './Icons'; // Assuming you have a CheckIcon

export interface Step {
  id: ProcessingStep;
  name: string;
  icon: React.ReactNode;
}

interface ProgressStepperProps {
  steps: Step[];
  currentStepId: ProcessingStep;
}

export const ProgressStepper: React.FC<ProgressStepperProps> = ({ steps, currentStepId }) => {
  const currentStepIndex = steps.findIndex(step => step.id === currentStepId);

  return (
    <nav aria-label="Progress">
      <ol role="list" className="flex flex-wrap items-center justify-center gap-y-4 gap-x-2 sm:gap-x-4">
        {steps.map((step, stepIdx) => (
          <li key={step.name} className={`flex items-center ${stepIdx !== steps.length -1 ? 'sm:flex-1 w-full sm:w-auto justify-start sm:justify-center' : ''}`}>
            {step.id < currentStepId || currentStepId === ProcessingStep.DONE ? (
              // Completed step
              <div className="group flex flex-col items-center text-center">
                <span className="flex items-center justify-center w-10 h-10 rounded-full bg-teal-500 group-hover:bg-teal-600">
                  <CheckIcon className="w-6 h-6 text-white" />
                </span>
                <span className="mt-1 text-xs font-medium text-teal-600">{step.name}</span>
              </div>
            ) : step.id === currentStepId ? (
              // Current step
              <div className="group flex flex-col items-center text-center" aria-current="step">
                <span className="flex items-center justify-center w-10 h-10 rounded-full border-2 border-sky-500 bg-sky-100">
                  <span className="h-5 w-5 text-sky-500">{step.icon}</span>
                </span>
                <span className="mt-1 text-xs font-medium text-sky-600">{step.name}</span>
              </div>
            ) : (
              // Upcoming step
              <div className="group flex flex-col items-center text-center">
                <span className="flex items-center justify-center w-10 h-10 rounded-full border-2 border-slate-300 bg-slate-50 group-hover:border-slate-400">
                  <span className="h-5 w-5 text-slate-400 group-hover:text-slate-500">{step.icon}</span>
                </span>
                <span className="mt-1 text-xs font-medium text-slate-500 group-hover:text-slate-700">{step.name}</span>
              </div>
            )}

            {/* Connector for larger screens */}
            {stepIdx !== steps.length - 1 && (
              <div className="hidden sm:block w-full h-0.5 bg-slate-300 mx-2 flex-1 group-aria-[current=step]:bg-sky-500 group-data-[completed=true]:bg-teal-500"
                   data-completed={step.id < currentStepId || currentStepId === ProcessingStep.DONE}
                   aria-current={step.id === currentStepId ? "step" : undefined}
              />
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

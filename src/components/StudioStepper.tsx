// src/components/studio/StudioStepper.tsx

import React from 'react';
import { Check, UploadCloud, Palette, Sparkles, Calendar } from 'lucide-react'; // 1. Imported Download icon

interface StepProps {
  icon: React.ReactNode;
  title: string;
  isComplete: boolean;
  isActive: boolean;
}

// 2. Added 'results' as a 4th step and shortened titles for better fit
const steps = [
  { id: 'upload', title: 'Upload', icon: <UploadCloud className="w-5 h-5" /> },
  { id: 'processing', title: 'Extract', icon: <Sparkles className="w-5 h-5" /> },
  { id: 'results', title: 'Add Event', icon: <Calendar className="w-5 h-5" /> }, // <-- The new step
];

const Step: React.FC<StepProps> = ({ icon, title, isComplete, isActive }) => {
  const getStepClasses = () => {
    if (isComplete) {
      // Completed step
      return 'bg-amber-600 text-white';
    }
    if (isActive) {
      // Active step
      return 'bg-white border-2 border-amber-600 text-amber-600';
    }
    // Inactive step
    return 'bg-gray-100 border-2 border-gray-200 text-gray-400';
  };

  const getTextClasses = () => {
    if (isComplete) {
      return 'text-gray-700';
    }
    if (isActive) {
      return 'text-amber-600';
    }
    return 'text-gray-400';
  };

  return (
    // 3. Adjusted width to w-16 to better accommodate four steps
    <div className="flex flex-col items-center w-16 z-10">
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${getStepClasses()}`}
      >
        {isComplete ? <Check className="w-5 h-5" /> : icon}
      </div>
      <p className={`mt-2 text-xs font-medium text-center ${getTextClasses()}`}>
        {title}
      </p>
    </div>
  );
};

interface StudioStepperProps {
  activeState: string;
}

export const StudioStepper: React.FC<StudioStepperProps> = ({ activeState }) => {
  // Find which step is active
  const activeIndex = steps.findIndex(step => step.id === activeState);

  // 4. This check will now only fail if the state is unknown,
  //    as 'results' will be found (activeIndex will be 3).
  if (activeIndex === -1) return null;

  return (
    <div className="w-full max-w-lg mt-3 px-3  ">
      <div className="flex justify-between items-start relative">
        {/* Connecting Lines */}
        <div className="absolute top-4 left-0 w-full h-0.5 bg-gray-200 z-10" /> {/* Adjusted top-4 for w-8/h-8 */}
        {/* Active Progress Line */}
        <div
          className="absolute top-4 left-0 h-0.5 bg-amber-600 z-10 transition-all duration-300" // Adjusted top-4
          style={{ width: `${(activeIndex / (steps.length - 1)) * 100}%` }} // This logic now works perfectly for 4 steps
        />
        
        {steps.map((step, index) => (
          <Step
            key={step.id}
            icon={step.icon}
            title={step.title}
            isComplete={index < activeIndex}
            isActive={index === activeIndex}
          />
        ))}
      </div>
    </div>
  );
};
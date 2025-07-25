import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

export type OnboardingStep =
  | 'welcome'
  | 'profile'
  | 'preferences'
  | 'security'
  | 'features'
  | 'complete';

export interface OnboardingState {
  currentStep: OnboardingStep;
  completedSteps: OnboardingStep[];
  isNextStepDisabled: string | false;
  setCurrentStep: (step: OnboardingStep) => void;
  finishOnboarding: () => void;
}

const steps: OnboardingStep[] = [
  'welcome',
  'profile',
  'preferences',
  'security',
  'features',
  'complete',
];

const OnboardingContext = createContext<OnboardingState | undefined>(undefined);

export const OnboardingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const [completedSteps, setCompletedSteps] = useState<OnboardingStep[]>([]);

  const onCurrentStepChange = useCallback(
    (step: OnboardingStep) => {
      setCurrentStep(step);
      const prevIdx = steps.indexOf(step) - 1;
      if (prevIdx >= 0) {
        const previousStep = steps[prevIdx];
        if (!completedSteps.includes(previousStep)) {
          setCompletedSteps(prev => [...prev, previousStep]);
        }
      }
    },
    [completedSteps]
  );

  const isNextStepDisabled = useMemo(() => {
    if (currentStep === 'profile' && !completedSteps.includes('welcome')) {
      return 'Please complete Welcome step.';
    }
    // Add more validation as needed
    return false;
  }, [currentStep, completedSteps]);

  const finishOnboarding = useCallback(() => {
    setCompletedSteps([...steps]);
    setCurrentStep('complete');
    localStorage.setItem('onboardingComplete', 'true');
  }, []);

  const value: OnboardingState = {
    currentStep,
    completedSteps,
    isNextStepDisabled,
    setCurrentStep: onCurrentStepChange,
    finishOnboarding,
  };

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
};

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) throw new Error('OnboardingContext not found');
  return context;
}

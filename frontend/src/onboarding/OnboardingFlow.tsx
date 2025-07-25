import React from 'react';
import { useOnboarding } from './OnboardingContext';

const stepTitles: Record<string, string> = {
  welcome: 'Welcome to A1Betting!',
  profile: 'Set Up Your Profile',
  preferences: 'Choose Your Preferences',
  security: 'Secure Your Account',
  features: 'Explore Key Features',
  complete: 'Onboarding Complete!',
};

const stepDescriptions: Record<string, string> = {
  welcome: 'Let’s get started with a quick tour.',
  profile: 'Tell us a bit about yourself.',
  preferences: 'Customize your experience.',
  security: 'Enable security options for your account.',
  features: 'See what you can do with A1Betting.',
  complete: 'You’re all set! Enjoy the app.',
};

const socialSignIn = (
  <div className='flex gap-4 my-4'>
    <button className='btn-gradient'>Sign in with Google</button>
    <button className='btn-gradient'>Sign in with Facebook</button>
    <button className='btn-glass'>Skip for now</button>
  </div>
);

export const OnboardingFlow: React.FC = () => {
  const { currentStep, completedSteps, isNextStepDisabled, setCurrentStep, finishOnboarding } =
    useOnboarding();
  const steps = Object.keys(stepTitles);
  const currentIdx = steps.indexOf(currentStep);

  // Concurrent React hooks
  const [isPending, startTransition] = React.useTransition();
  const deferredSteps = React.useDeferredValue(steps);

  return (
    <div className='glass-card max-w-xl mx-auto p-8 mt-12'>
      <h2 className='text-2xl font-bold text-gray-900 dark:text-white mb-2'>
        {stepTitles[currentStep]}
      </h2>
      <p className='text-gray-700 dark:text-gray-300 mb-6'>{stepDescriptions[currentStep]}</p>
      <div className='mb-6'>
        <progress
          value={completedSteps.length}
          max={deferredSteps.length - 1}
          className='progress-glass w-full'
        />
        <div className='flex justify-between mt-2'>
          {deferredSteps.map((step, idx) => (
            <span
              key={step}
              className={
                idx <= currentIdx
                  ? 'text-primary-500 font-bold'
                  : 'text-gray-300 dark:text-gray-600'
              }
              aria-label={stepTitles[step]}
            >
              ●
            </span>
          ))}
        </div>
      </div>
      {isPending && <div className='text-blue-600 mb-2'>Loading...</div>}
      {currentStep === 'welcome' && socialSignIn}
      <div className='mt-8 flex gap-4'>
        {currentIdx > 0 && (
          <button
            onClick={() => startTransition(() => setCurrentStep(steps[currentIdx - 1] as any))}
            className='btn-glass'
            disabled={isPending}
          >
            Back
          </button>
        )}
        {currentStep !== 'complete' ? (
          <button
            onClick={() => {
              if (isNextStepDisabled) return;
              startTransition(() => {
                if (currentIdx < steps.length - 1) {
                  setCurrentStep(steps[currentIdx + 1] as any);
                } else {
                  finishOnboarding();
                }
              });
            }}
            className='btn-gradient'
            disabled={!!isNextStepDisabled || isPending}
          >
            {currentIdx < steps.length - 1 ? 'Next' : 'Finish'}
          </button>
        ) : (
          <>
            <span className='text-primary-600 font-bold text-lg flex items-center gap-2'>
              <span role='img' aria-label='party'>
                🎉
              </span>{' '}
              Onboarding Complete!{' '}
              <span role='img' aria-label='party'>
                🎉
              </span>
            </span>
            <button
              className='btn-gradient ml-4'
              onClick={() => {
                localStorage.setItem('onboardingComplete', 'true');
                setTimeout(() => window.location.reload(), 100);
              }}
            >
              Continue to App
            </button>
          </>
        )}
        {isNextStepDisabled && <div className='text-red-600 mt-2'>{isNextStepDisabled}</div>}
      </div>
    </div>
  );
};

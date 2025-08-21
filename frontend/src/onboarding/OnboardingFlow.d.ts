import React from 'react';

export interface OnboardingFlowProps {
	className?: string;
	onComplete?: () => void;
	[key: string]: unknown;
}

export const OnboardingFlow: React.ComponentType<OnboardingFlowProps>;
export default OnboardingFlow;


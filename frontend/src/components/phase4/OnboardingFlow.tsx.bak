/**
 * User Onboarding Flow Component
 * Interactive tutorial system for new users
 */

import * as React from 'react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Play,
  SkipForward,
  Target,
  Brain,
  BarChart3,
  Settings,
  Zap,
  Shield,
  Users,
  BookOpen,
  Sparkles,
  Trophy,
  Eye,
  MousePointer,
  Keyboard,
  Smartphone
} from 'lucide-react';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  content: React.ReactNode;
  action?: string;
  highlight?: string;
}

const OnboardingFlow: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [userPreferences, setUserPreferences] = useState({
    experience: '',
    interests: [] as string[],
    goals: [] as string[]
  });

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to A1Betting',
      description: 'Your AI-powered sports betting analytics platform',
      content: (
        <div className="text-center space-y-6">
          <div className="w-24 h-24 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full flex items-center justify-center mx-auto">
            <Sparkles className="w-12 h-12 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-white mb-4">Welcome to the Future of Sports Betting</h2>
            <p className="text-slate-400 text-lg leading-relaxed max-w-2xl mx-auto">
              A1Betting combines advanced AI, quantum optimization, and real-time analytics to give you 
              the edge in sports betting. Let's get you started with a quick tour.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
            <div className="bg-slate-800/50 rounded-lg p-4">
              <Brain className="w-8 h-8 text-purple-400 mx-auto mb-2" />
              <h3 className="font-semibold text-white">AI Predictions</h3>
              <p className="text-slate-400 text-sm">Advanced ML models with 94%+ accuracy</p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4">
              <Zap className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
              <h3 className="font-semibold text-white">Quantum Optimization</h3>
              <p className="text-slate-400 text-sm">Portfolio optimization for maximum returns</p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4">
              <BarChart3 className="w-8 h-8 text-blue-400 mx-auto mb-2" />
              <h3 className="font-semibold text-white">Real-time Analytics</h3>
              <p className="text-slate-400 text-sm">Live data and instant insights</p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'experience',
      title: 'Tell Us About Yourself',
      description: 'Help us customize your experience',
      content: (
        <div className="space-y-6">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">What's your betting experience?</h2>
            <p className="text-slate-400">This helps us tailor the interface and recommendations for you.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { id: 'beginner', title: 'New to Betting', description: 'Just starting out', icon: Users },
              { id: 'intermediate', title: 'Some Experience', description: '1-3 years of betting', icon: Target },
              { id: 'expert', title: 'Experienced', description: '3+ years, advanced strategies', icon: Trophy }
            ].map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.id}
                  onClick={() => setUserPreferences(prev => ({ ...prev, experience: option.id }))}
                  className={`p-6 rounded-lg border-2 transition-all ${
                    userPreferences.experience === option.id
                      ? 'border-emerald-400 bg-emerald-400/10'
                      : 'border-slate-600 bg-slate-800/50 hover:border-slate-500'
                  }`}
                >
                  <Icon className={`w-8 h-8 mx-auto mb-3 ${
                    userPreferences.experience === option.id ? 'text-emerald-400' : 'text-slate-400'
                  }`} />
                  <h3 className="font-semibold text-white mb-2">{option.title}</h3>
                  <p className="text-slate-400 text-sm">{option.description}</p>
                </button>
              );
            })}
          </div>
        </div>
      )
    },
    {
      id: 'interests',
      title: 'Sports & Markets',
      description: 'Choose your favorite sports and betting markets',
      content: (
        <div className="space-y-6">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">What sports interest you most?</h2>
            <p className="text-slate-400">Select all that apply - we'll prioritize these in your dashboard.</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              'NFL', 'NBA', 'MLB', 'NHL', 'Soccer', 'Tennis', 'Golf', 'Boxing/MMA'
            ].map((sport) => (
              <button
                key={sport}
                onClick={() => {
                  setUserPreferences(prev => ({
                    ...prev,
                    interests: prev.interests.includes(sport)
                      ? prev.interests.filter(s => s !== sport)
                      : [...prev.interests, sport]
                  }));
                }}
                className={`p-4 rounded-lg border-2 transition-all ${
                  userPreferences.interests.includes(sport)
                    ? 'border-emerald-400 bg-emerald-400/10 text-emerald-400'
                    : 'border-slate-600 bg-slate-800/50 hover:border-slate-500 text-slate-300'
                }`}
              >
                <div className="font-semibold">{sport}</div>
              </button>
            ))}
          </div>
        </div>
      )
    },
    {
      id: 'goals',
      title: 'Your Goals',
      description: 'What do you want to achieve?',
      content: (
        <div className="space-y-6">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">What are your betting goals?</h2>
            <p className="text-slate-400">This helps us recommend the right features and strategies.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { id: 'profit', title: 'Maximize Profits', description: 'Focus on high-value opportunities', icon: Trophy },
              { id: 'learning', title: 'Learn & Improve', description: 'Understand betting strategies', icon: BookOpen },
              { id: 'entertainment', title: 'Entertainment', description: 'Casual betting for fun', icon: Play },
              { id: 'research', title: 'Deep Analysis', description: 'Advanced research tools', icon: BarChart3 }
            ].map((goal) => {
              const Icon = goal.icon;
              return (
                <button
                  key={goal.id}
                  onClick={() => {
                    setUserPreferences(prev => ({
                      ...prev,
                      goals: prev.goals.includes(goal.id)
                        ? prev.goals.filter(g => g !== goal.id)
                        : [...prev.goals, goal.id]
                    }));
                  }}
                  className={`p-6 rounded-lg border-2 transition-all text-left ${
                    userPreferences.goals.includes(goal.id)
                      ? 'border-emerald-400 bg-emerald-400/10'
                      : 'border-slate-600 bg-slate-800/50 hover:border-slate-500'
                  }`}
                >
                  <Icon className={`w-6 h-6 mb-3 ${
                    userPreferences.goals.includes(goal.id) ? 'text-emerald-400' : 'text-slate-400'
                  }`} />
                  <h3 className="font-semibold text-white mb-2">{goal.title}</h3>
                  <p className="text-slate-400 text-sm">{goal.description}</p>
                </button>
              );
            })}
          </div>
        </div>
      )
    },
    {
      id: 'dashboard',
      title: 'Your Dashboard',
      description: 'Overview of key features',
      content: (
        <div className="space-y-6">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">Your Personalized Dashboard</h2>
            <p className="text-slate-400">Based on your preferences, here's what we've set up for you.</p>
          </div>
          
          <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-600">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-3">
                <h3 className="font-semibold text-white flex items-center">
                  <Target className="w-5 h-5 mr-2 text-emerald-400" />
                  Quick Predictions
                </h3>
                <p className="text-slate-400 text-sm">
                  AI recommendations for {userPreferences.interests.slice(0, 2).join(' & ')} with confidence scores
                </p>
              </div>
              
              <div className="space-y-3">
                <h3 className="font-semibold text-white flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2 text-blue-400" />
                  Performance Tracking
                </h3>
                <p className="text-slate-400 text-sm">
                  Monitor your betting performance and ROI over time
                </p>
              </div>
              
              <div className="space-y-3">
                <h3 className="font-semibold text-white flex items-center">
                  <Zap className="w-5 h-5 mr-2 text-yellow-400" />
                  Portfolio Optimization
                </h3>
                <p className="text-slate-400 text-sm">
                  Quantum-optimized recommendations for risk management
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'features',
      title: 'Key Features Tour',
      description: 'Learn about our main capabilities',
      content: (
        <div className="space-y-6">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">Explore Key Features</h2>
            <p className="text-slate-400">Here are the main features you'll use most often.</p>
          </div>
          
          <div className="space-y-4">
            {[
              {
                title: 'AI Predictions',
                description: 'Get instant AI-powered betting recommendations with confidence scores',
                icon: Brain,
                color: 'purple'
              },
              {
                title: 'Research Hub',
                description: 'Deep dive into player stats, matchup analysis, and market trends',
                icon: BarChart3,
                color: 'blue'
              },
              {
                title: 'Portfolio Manager',
                description: 'Optimize your betting portfolio with quantum algorithms',
                icon: Zap,
                color: 'yellow'
              },
              {
                title: 'Real-time Alerts',
                description: 'Get notified of value opportunities and market changes',
                icon: Eye,
                color: 'green'
              }
            ].map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start space-x-4 p-4 bg-slate-800/50 rounded-lg border border-slate-600"
                >
                  <Icon className={`w-6 h-6 text-${feature.color}-400 mt-1`} />
                  <div>
                    <h3 className="font-semibold text-white mb-1">{feature.title}</h3>
                    <p className="text-slate-400 text-sm">{feature.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )
    },
    {
      id: 'complete',
      title: 'Setup Complete!',
      description: 'You\'re ready to start winning',
      content: (
        <div className="text-center space-y-6">
          <div className="w-24 h-24 bg-gradient-to-r from-emerald-400 to-green-400 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-white mb-4">You're All Set!</h2>
            <p className="text-slate-400 text-lg leading-relaxed max-w-2xl mx-auto">
              Your personalized A1Betting experience is ready. Start exploring AI predictions, 
              research tools, and portfolio optimization to maximize your betting success.
            </p>
          </div>
          
          <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-600 max-w-lg mx-auto">
            <h3 className="font-semibold text-white mb-4">Quick Start Tips:</h3>
            <div className="space-y-3 text-left">
              <div className="flex items-center space-x-3">
                <MousePointer className="w-4 h-4 text-emerald-400" />
                <span className="text-slate-300 text-sm">Check the Dashboard for daily recommendations</span>
              </div>
              <div className="flex items-center space-x-3">
                <Keyboard className="w-4 h-4 text-emerald-400" />
                <span className="text-slate-300 text-sm">Use the search bar to find specific games or players</span>
              </div>
              <div className="flex items-center space-x-3">
                <Smartphone className="w-4 h-4 text-emerald-400" />
                <span className="text-slate-300 text-sm">Access everything on mobile with our responsive design</span>
              </div>
            </div>
          </div>
        </div>
      )
    }
  ];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsCompleted(true);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const skipTour = () => {
    setIsCompleted(true);
  };

  if (isCompleted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-6"
        >
          <div className="w-32 h-32 bg-gradient-to-r from-emerald-400 to-green-400 rounded-full flex items-center justify-center mx-auto">
            <Trophy className="w-16 h-16 text-white" />
          </div>
          <h1 className="text-4xl font-bold">Welcome to A1Betting!</h1>
          <p className="text-slate-400 text-lg max-w-md">
            Your personalized experience is ready. Start making smarter bets today.
          </p>
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
          >
            Go to Dashboard
          </button>
        </motion.div>
      </div>
    );
  }

  const currentStepData = steps[currentStep];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Progress Bar */}
      <div className="w-full bg-slate-800 h-1">
        <div
          className="bg-gradient-to-r from-emerald-400 to-cyan-400 h-1 transition-all duration-500"
          style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
        ></div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-slate-700">
        <div>
          <h1 className="text-2xl font-bold">A1Betting Setup</h1>
          <p className="text-slate-400">Step {currentStep + 1} of {steps.length}</p>
        </div>
        <button
          onClick={skipTour}
          className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors"
        >
          <SkipForward className="w-4 h-4" />
          <span>Skip Tour</span>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-4xl w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              <div className="text-center">
                <h2 className="text-3xl font-bold text-white mb-2">{currentStepData.title}</h2>
                <p className="text-slate-400 text-lg">{currentStepData.description}</p>
              </div>

              <div className="bg-slate-800/30 backdrop-blur-lg border border-slate-700 rounded-xl p-8">
                {currentStepData.content}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between p-6 border-t border-slate-700">
        <button
          onClick={prevStep}
          disabled={currentStep === 0}
          className="flex items-center space-x-2 px-6 py-3 rounded-lg bg-slate-700 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Previous</span>
        </button>

        <div className="flex space-x-2">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentStep ? 'bg-emerald-400' :
                index < currentStep ? 'bg-emerald-600' : 'bg-slate-600'
              }`}
            ></div>
          ))}
        </div>

        <button
          onClick={nextStep}
          className="flex items-center space-x-2 px-6 py-3 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
        >
          <span>{currentStep === steps.length - 1 ? 'Complete' : 'Next'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default OnboardingFlow;

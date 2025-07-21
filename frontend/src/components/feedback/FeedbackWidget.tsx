import { MessageSquare, Send, Star, X } from 'lucide-react';
import React, { useState } from 'react';

interface FeedbackWidgetProps {
  trigger?: 'beta' | 'general';
  feature?: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

interface FeedbackData {
  type: 'bug' | 'feature' | 'improvement' | 'other';
  rating: number;
  message: string;
  feature?: string;
  userAgent: string;
  url: string;
  timestamp: string;
}

const FeedbackWidget: React.FC<FeedbackWidgetProps> = ({
  trigger = 'general',
  feature,
  position = 'bottom-right',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [feedback, setFeedback] = useState<Partial<FeedbackData>>({
    type: 'improvement',
    rating: 0,
    message: '',
    feature,
  });

  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.message?.trim()) return;

    setIsSubmitting(true);

    try {
      const feedbackData: FeedbackData = {
        type: feedback.type as FeedbackData['type'],
        rating: feedback.rating || 0,
        message: feedback.message,
        feature: feedback.feature,
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date().toISOString(),
      };

      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(feedbackData),
      });

      if (response.ok) {
        setIsSubmitted(true);
        setTimeout(() => {
          setIsOpen(false);
          setIsSubmitted(false);
          setFeedback({
            type: 'improvement',
            rating: 0,
            message: '',
            feature,
          });
        }, 2000);
      }
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRatingClick = (rating: number) => {
    setFeedback(prev => ({ ...prev, rating }));
  };

  if (trigger === 'beta') {
    return (
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div className='inline-flex items-center gap-2 text-sm text-gray-600'>
        <button
          onClick={() => setIsOpen(true)}
          className='text-blue-600 hover:text-blue-800 underline font-medium'
        >
          Send feedback
        </button>
        {isOpen && (
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <FeedbackModal
            isSubmitted={isSubmitted}
            isSubmitting={isSubmitting}
            feedback={feedback}
            setFeedback={setFeedback}
            onClose={() => setIsOpen(false)}
            onSubmit={handleSubmit}
            onRatingClick={handleRatingClick}
          />
        )}
      </div>
    );
  }

  return (
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <>
      {/* Floating Feedback Button */}
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove
      this comment to see the full error message
      <div className={`fixed ${positionClasses[position]} z-50`}>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove
        this comment to see the full error message
        <label htmlFor='feedbackwidget-float-btn' className='sr-only'>
          Send Feedback
        </label>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove
        this comment to see the full error message
        <button
          id='feedbackwidget-float-btn'
          onClick={() => setIsOpen(true)}
          className='bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-105'
          title='Send Feedback'
        >
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <MessageSquare size={20} />
        </button>
      </div>
      {/* Feedback Modal */}
      {isOpen && (
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <FeedbackModal
          isSubmitted={isSubmitted}
          isSubmitting={isSubmitting}
          feedback={feedback}
          setFeedback={setFeedback}
          onClose={() => setIsOpen(false)}
          onSubmit={handleSubmit}
          onRatingClick={handleRatingClick}
        />
      )}
    </>
  );
};

interface FeedbackModalProps {
  isSubmitted: boolean;
  isSubmitting: boolean;
  feedback: Partial<FeedbackData>;
  setFeedback: React.Dispatch<React.SetStateAction<Partial<FeedbackData>>>;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onRatingClick: (rating: number) => void;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isSubmitted,
  isSubmitting,
  feedback,
  setFeedback,
  onClose,
  onSubmit,
  onRatingClick,
}) => {
  if (isSubmitted) {
    return (
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove
        this comment to see the full error message
        <div className='bg-white rounded-lg p-6 max-w-md w-full mx-4 text-center'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <div className='w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <svg
              className='w-6 h-6 text-green-600'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M5 13l4 4L19 7'
              />
            </svg>
          </div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <h3 className='text-lg font-semibold text-gray-900 mb-2'>Thank you!</h3>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <p className='text-gray-600'>Your feedback has been sent successfully.</p>
        </div>
      </div>
    );
  }

  return (
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'>
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove
      this comment to see the full error message
      <div className='bg-white rounded-lg p-6 max-w-md w-full mx-4'>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove
        this comment to see the full error message
        <div className='flex items-center justify-between mb-4'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <h3 className='text-lg font-semibold text-gray-900'>Send Feedback</h3>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <button
            onClick={onClose}
            className='text-gray-400 hover:text-gray-600'
            aria-label='Close'
          >
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <X size={20} />
          </button>
        </div>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove
        this comment to see the full error message
        <form onSubmit={onSubmit} className='space-y-4'>
          {/* Feedback Type */}
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <label className='block text-sm font-medium text-gray-700 mb-2' htmlFor='feedback-type'>
              Feedback Type
            </label>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <select
              id='feedback-type'
              value={feedback.type}
              onChange={e =>
                setFeedback(prev => ({ ...prev, type: e.target.value as FeedbackData['type'] }))
              }
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
            >
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <option value='improvement'>Improvement</option>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <option value='bug'>Bug Report</option>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <option value='feature'>Feature Request</option>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <option value='other'>Other</option>
            </select>
          </div>
          {/* Rating */}
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <label
              className='block text-sm font-medium text-gray-700 mb-2'
              htmlFor='feedback-rating'
            >
              How would you rate this feature?
            </label>
            <input
              id='feedback-rating'
              name='feedback-rating'
              type='number'
              min='1'
              max='5'
              className='ml-2'
            />
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <div className='flex gap-1' aria-labelledby='feedback-rating-label' role='radiogroup'>
              {[1, 2, 3, 4, 5].map(star => (
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <button
                  key={star}
                  type='button'
                  role='radio'
                  aria-checked={star === feedback.rating}
                  onClick={() => onRatingClick(star)}
                  className={`p-1 ${
                    star <= (feedback.rating || 0) ? 'text-yellow-400' : 'text-gray-300'
                  } hover:text-yellow-400 transition-colors`}
                  aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                >
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <Star size={20} fill='currentColor' />
                </button>
              ))}
            </div>
          </div>
          {/* Message */}
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <label
              className='block text-sm font-medium text-gray-700 mb-2'
              htmlFor='feedback-message'
            >
              Your feedback *
            </label>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <textarea
              id='feedback-message'
              value={feedback.message}
              onChange={e => setFeedback(prev => ({ ...prev, message: e.target.value }))}
              placeholder='Tell us what you think...'
              rows={4}
              required
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none'
            />
          </div>
          {/* Submit Button */}
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <div className='flex gap-3 pt-2'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <button
              type='button'
              onClick={onClose}
              className='flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors'
            >
              Cancel
            </button>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <button
              type='submit'
              disabled={isSubmitting || !feedback.message?.trim()}
              className='flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2'
            >
              {isSubmitting ? (
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <div className='w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin' />
                  Sending...
                </>
              ) : (
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <Send size={16} />
                  Send Feedback
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FeedbackWidget;

// @ts-expect-error TS(2307): Cannot find module '@/components/ui/GlassCard' or ... Remove this comment to see the full error message
import GlassCard from '@/components/ui/GlassCard';
// @ts-expect-error TS(2307): Cannot find module '@/components/ui/GlowButton' or... Remove this comment to see the full error message
import GlowButton from '@/components/ui/GlowButton';
import { motion } from 'framer-motion';
import React from 'react';
import { useNavigate } from 'react-router-dom';

const NotFound: React.FC = () => {
  const navigate = useNavigate();
  return (
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <motion.div animate={{ opacity: 1 }} exit={{ opacity: 0 }} initial={{ opacity: 0 }}>
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div className='flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-100 to-blue-50 dark:from-gray-900 dark:to-blue-950'>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <GlassCard className='max-w-lg w-full text-center p-10'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <h1 className='text-6xl font-extrabold text-blue-700 dark:text-blue-200 mb-2'>404</h1>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <h2 className='text-2xl font-bold text-blue-900 dark:text-blue-100 mb-4'>
            Page Not Found
          </h2>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <p className='text-gray-600 dark:text-gray-300 mb-6'>
            The page you're looking for doesn't exist or has been moved.
          </p>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <GlowButton onClick={() => navigate('/')}>Go to Home</GlowButton>
        </GlassCard>
      </div>
    </motion.div>
  );
};

export default NotFound;

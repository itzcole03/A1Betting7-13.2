import React from 'react';
import { toast, Toaster as HotToaster } from 'react-hot-toast';

export const Toaster: React.FC = () => {
  return (
    <HotToaster
      position='bottom-right'
      toastOptions={{
        duration: 3000, // Reduced from 4000ms to 3000ms to be less spammy
        style: {
          background: '#1a1a1a',
          color: '#fff',
          border: '1px solid #333',
          borderRadius: '12px',
          fontSize: '14px',
          maxWidth: '400px',
        },
        success: {
          style: {
            background: '#059669',
            border: '1px solid #10b981',
          },
        },
        error: {
          style: {
            background: '#dc2626',
            border: '1px solid #ef4444',
          },
        },
        loading: {
          style: {
            background: '#1e40af',
            border: '1px solid #3b82f6',
          },
        },
      }}
    />
  );
};

export const showToast = {
  success: (message: string) => toast.success(message),
  error: (message: string) => toast.error(message),
  info: (message: string) => toast(message),
  loading: (message: string) => toast.loading(message),
};

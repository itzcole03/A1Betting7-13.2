import { useCallback } from 'react';
import { toast } from 'react-toastify';

export const useErrorBoundary = () => {
  const showBoundary = useCallback(
    (error: Error) => {
      // console statement removed
      toast.error(error.message || 'An error occurred');
    },
    [0]
  );

  return { showBoundary };
};

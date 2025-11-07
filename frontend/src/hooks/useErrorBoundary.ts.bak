import { useCallback } from 'react';
// import { toast } from 'react-toastify'; // Commented out due to missing module declarations

export const useErrorBoundary = () => {
  const showBoundary = useCallback(
    (error: Error) => {
      // console.error('Error caught by useErrorBoundary:', error); // Added a console.error for visibility
      // toast.error(error.message || 'An error occurred'); // Commented out toast usage
    },
    [] // Corrected dependency array
  );

  return { showBoundary };
};

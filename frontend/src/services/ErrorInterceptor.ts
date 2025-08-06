import { useErrorStore } from '../stores/errorStore';

export function handleHttpError(error: any, correlationId?: string) {
  const addError = useErrorStore.getState().addError;
  let category: 'network' | 'validation' | 'authorization' | 'business' | 'unknown' = 'unknown';
  let statusCode: number | undefined;
  let message = 'An unknown error occurred.';

  if (error?.response) {
    statusCode = error.response.status;
    message = error.response.data?.message || error.message || String(error);
    if (statusCode === 401 || statusCode === 403) category = 'authorization';
    else if (statusCode === 400 || statusCode === 422) category = 'validation';
    else if (statusCode === 404) category = 'business';
    else if (statusCode === 429) category = 'business';
    else if (statusCode >= 500) category = 'network';
  } else if (error?.request) {
    category = 'network';
    message = 'Network error: Could not reach server.';
  } else if (error?.message) {
    message = error.message;
  }

  addError({
    id: correlationId || crypto.randomUUID(),
    message,
    category,
    statusCode,
    details: error,
    correlationId,
  });
}

// Example usage: wrap fetch/axios error handling
// try { ... } catch (err) { handleHttpError(err, correlationId); }

import { PropOllamaError, PropOllamaErrorType } from '../errors';

describe('PropOllamaError', () => {
  test('creates network error', () => {
    const error = PropOllamaError.networkError('Network error');
    
    expect(error.type).toBe(PropOllamaErrorType.NETWORK_ERROR);
    expect(error.message).toBe('Network error');
    expect(error.retryable).toBe(true);
    expect(error.fallbackAvailable).toBe(true);
  });
  
  test('creates timeout error', () => {
    const error = PropOllamaError.timeoutError('Timeout error');
    
    expect(error.type).toBe(PropOllamaErrorType.TIMEOUT_ERROR);
    expect(error.message).toBe('Timeout error');
    expect(error.retryable).toBe(true);
    expect(error.fallbackAvailable).toBe(true);
  });
  
  test('creates LLM unavailable error', () => {
    const error = PropOllamaError.llmUnavailableError('LLM service is unavailable');
    
    expect(error.type).toBe(PropOllamaErrorType.LLM_UNAVAILABLE);
    expect(error.message).toBe('LLM service is unavailable');
    expect(error.retryable).toBe(true);
    expect(error.fallbackAvailable).toBe(true);
  });
  
  test('creates data fetch error', () => {
    const error = PropOllamaError.dataFetchError('Failed to fetch data');
    
    expect(error.type).toBe(PropOllamaErrorType.DATA_FETCH_ERROR);
    expect(error.message).toBe('Failed to fetch data');
    expect(error.retryable).toBe(true);
    expect(error.fallbackAvailable).toBe(true);
  });
  
  test('creates insufficient data error', () => {
    const error = PropOllamaError.insufficientDataError('Not enough data');
    
    expect(error.type).toBe(PropOllamaErrorType.INSUFFICIENT_DATA);
    expect(error.message).toBe('Not enough data');
    expect(error.retryable).toBe(false);
    expect(error.fallbackAvailable).toBe(true);
  });
  
  test('creates parsing error', () => {
    const error = PropOllamaError.parsingError('Failed to parse response');
    
    expect(error.type).toBe(PropOllamaErrorType.PARSING_ERROR);
    expect(error.message).toBe('Failed to parse response');
    expect(error.retryable).toBe(false);
    expect(error.fallbackAvailable).toBe(true);
  });
  
  test('creates unknown error', () => {
    const error = PropOllamaError.unknownError('Unknown error');
    
    expect(error.type).toBe(PropOllamaErrorType.UNKNOWN_ERROR);
    expect(error.message).toBe('Unknown error');
    expect(error.retryable).toBe(false);
    expect(error.fallbackAvailable).toBe(true);
  });
  
  test('converts generic error to PropOllamaError', () => {
    const genericError = new Error('Generic error');
    const propError = PropOllamaError.fromError(genericError);
    
    expect(propError).toBeInstanceOf(PropOllamaError);
    expect(propError.type).toBe(PropOllamaErrorType.UNKNOWN_ERROR);
    expect(propError.message).toBe('Generic error');
  });
  
  test('converts Axios error to PropOllamaError', () => {
    const axiosError = {
      isAxiosError: true,
      response: {
        status: 500,
        data: {
          detail: 'Internal Server Error',
        },
      },
      message: 'Request failed with status code 500',
    };
    
    const propError = PropOllamaError.fromError(axiosError);
    
    expect(propError).toBeInstanceOf(PropOllamaError);
    expect(propError.type).toBe(PropOllamaErrorType.LLM_UNAVAILABLE);
    expect(propError.message).toBe('LLM service is unavailable');
  });
  
  test('converts Axios network error to PropOllamaError', () => {
    const axiosError = {
      isAxiosError: true,
      response: undefined,
      message: 'Network Error',
    };
    
    const propError = PropOllamaError.fromError(axiosError);
    
    expect(propError).toBeInstanceOf(PropOllamaError);
    expect(propError.type).toBe(PropOllamaErrorType.NETWORK_ERROR);
    expect(propError.message).toBe('Network error: Unable to connect to the server');
  });
  
  test('converts Axios timeout error to PropOllamaError', () => {
    const axiosError = {
      isAxiosError: true,
      code: 'ECONNABORTED',
      message: 'timeout of 10000ms exceeded',
    };
    
    const propError = PropOllamaError.fromError(axiosError);
    
    expect(propError).toBeInstanceOf(PropOllamaError);
    expect(propError.type).toBe(PropOllamaErrorType.TIMEOUT_ERROR);
    expect(propError.message).toBe('Request timed out');
  });
  
  test('handles error with details', () => {
    const error = PropOllamaError.networkError('Network error', { 
      url: 'https://api.example.com',
      statusCode: 404 
    });
    
    expect(error.details).toEqual({ 
      url: 'https://api.example.com',
      statusCode: 404 
    });
  });
  
  test('preserves PropOllamaError when converting from error', () => {
    const originalError = PropOllamaError.dataFetchError('Original error');
    const convertedError = PropOllamaError.fromError(originalError);
    
    expect(convertedError).toBe(originalError);
    expect(convertedError.type).toBe(PropOllamaErrorType.DATA_FETCH_ERROR);
    expect(convertedError.message).toBe('Original error');
  });
});
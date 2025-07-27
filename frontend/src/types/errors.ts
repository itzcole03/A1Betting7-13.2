/**
 * PropOllama Error Types and Error Class
 */

export enum PropOllamaErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  LLM_UNAVAILABLE = 'LLM_UNAVAILABLE',
  DATA_FETCH_ERROR = 'DATA_FETCH_ERROR',
  INSUFFICIENT_DATA = 'INSUFFICIENT_DATA',
  PARSING_ERROR = 'PARSING_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export class PropOllamaError extends Error {
  type: PropOllamaErrorType;
  retryable: boolean;
  fallbackAvailable: boolean;
  details?: Record<string, any>;

  constructor(
    message: string,
    type: PropOllamaErrorType,
    retryable: boolean = false,
    fallbackAvailable: boolean = false,
    details?: Record<string, any>
  ) {
    super(message);
    this.name = 'PropOllamaError';
    this.type = type;
    this.retryable = retryable;
    this.fallbackAvailable = fallbackAvailable;
    this.details = details;
  }

  static networkError(message: string, details?: Record<string, any>): PropOllamaError {
    return new PropOllamaError(
      message,
      PropOllamaErrorType.NETWORK_ERROR,
      true, // retryable
      true, // fallback available
      details
    );
  }

  static timeoutError(message: string, details?: Record<string, any>): PropOllamaError {
    return new PropOllamaError(
      message,
      PropOllamaErrorType.TIMEOUT_ERROR,
      true, // retryable
      true, // fallback available
      details
    );
  }

  static llmUnavailableError(message: string, details?: Record<string, any>): PropOllamaError {
    return new PropOllamaError(
      message,
      PropOllamaErrorType.LLM_UNAVAILABLE,
      true, // retryable
      true, // fallback available
      details
    );
  }

  static dataFetchError(message: string, details?: Record<string, any>): PropOllamaError {
    return new PropOllamaError(
      message,
      PropOllamaErrorType.DATA_FETCH_ERROR,
      true, // retryable
      true, // fallback available
      details
    );
  }

  static insufficientDataError(message: string, details?: Record<string, any>): PropOllamaError {
    return new PropOllamaError(
      message,
      PropOllamaErrorType.INSUFFICIENT_DATA,
      false, // not retryable
      true, // fallback available
      details
    );
  }

  static parsingError(message: string, details?: Record<string, any>): PropOllamaError {
    return new PropOllamaError(
      message,
      PropOllamaErrorType.PARSING_ERROR,
      false, // not retryable
      true, // fallback available
      details
    );
  }

  static unknownError(message: string, details?: Record<string, any>): PropOllamaError {
    return new PropOllamaError(
      message,
      PropOllamaErrorType.UNKNOWN_ERROR,
      false, // not retryable
      true, // fallback available
      details
    );
  }

  static fromError(error: any): PropOllamaError {
    // Handle Axios errors
    if (error && error.isAxiosError) {
      if (!error.response) {
        return PropOllamaError.networkError(
          'Network error: Unable to connect to the server',
          { originalError: error.message }
        );
      }

      const status = error.response.status;
      
      // Handle different HTTP status codes
      if (status === 404) {
        return PropOllamaError.networkError(
          'Resource not found',
          { status, originalError: error.message }
        );
      } else if (status === 401 || status === 403) {
        return PropOllamaError.networkError(
          'Authentication error',
          { status, originalError: error.message }
        );
      } else if (status === 429) {
        return PropOllamaError.networkError(
          'Rate limit exceeded',
          { status, originalError: error.message }
        );
      } else if (status >= 500) {
        return PropOllamaError.llmUnavailableError(
          'LLM service is unavailable',
          { status, originalError: error.message }
        );
      }
      
      return PropOllamaError.networkError(
        `HTTP error: ${error.response.status}`,
        { status, originalError: error.message }
      );
    }
    
    // Handle timeout errors
    if (error && error.code === 'ECONNABORTED') {
      return PropOllamaError.timeoutError(
        'Request timed out',
        { originalError: error.message }
      );
    }
    
    // Handle PropOllamaError instances
    if (error instanceof PropOllamaError) {
      return error;
    }
    
    // Handle generic errors
    return PropOllamaError.unknownError(
      error?.message || 'Unknown error occurred',
      { originalError: error }
    );
  }
}
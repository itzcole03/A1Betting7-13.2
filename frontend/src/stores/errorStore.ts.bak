import { create } from 'zustand';

export type ErrorCategory = 'network' | 'validation' | 'authorization' | 'business' | 'unknown';

export interface AppError {
  id: string; // UUID or correlation ID
  message: string;
  category: ErrorCategory;
  statusCode?: number;
  details?: any;
  correlationId?: string;
  timestamp: number;
  read: boolean;
  dismissed: boolean;
}

export interface ErrorStoreState {
  errors: AppError[];
  addError: (error: Omit<AppError, 'timestamp' | 'read' | 'dismissed'>) => void;
  markAsRead: (id: string) => void;
  dismissError: (id: string) => void;
  clearErrors: () => void;
}

export const useErrorStore = create<ErrorStoreState>(set => ({
  errors: [],
  addError: error => {
    set(state => ({
      errors: [
        {
          ...error,
          timestamp: Date.now(),
          read: false,
          dismissed: false,
        },
        ...state.errors,
      ],
    }));
  },
  markAsRead: id => {
    set(state => ({
      errors: state.errors.map(err => (err.id === id ? { ...err, read: true } : err)),
    }));
  },
  dismissError: id => {
    set(state => ({
      errors: state.errors.map(err => (err.id === id ? { ...err, dismissed: true } : err)),
    }));
  },
  clearErrors: () => set({ errors: [] }),
}));

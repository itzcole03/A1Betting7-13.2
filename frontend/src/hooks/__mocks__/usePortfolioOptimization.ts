export function usePortfolioOptimization() {
  // eslint-disable-next-line no-console
  console.log('[MOCK] usePortfolioOptimization called');
  return {
    isLoading: false,
    isError: true,
    data: undefined,
    error: new Error('Mocked error'),
  };
}

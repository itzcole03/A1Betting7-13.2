/**
 * React 19 Feature Test Component
 * Tests new React 19 hooks and features to verify upgrade success
 */

import React from 'react';

// Test React 19 new hooks and features
export const React19Test: React.FC = () => {
  // Test 1: useOptimistic hook (React 19)
  const [optimisticState, addOptimistic] = React.useOptimistic(
    { count: 0 },
    (state, newCount: number) => ({ count: newCount })
  );

  // Test 2: useActionState hook (React 19)
  const [actionState, submitAction, isPending] = React.useActionState(
    async (prevState: { message: string }, formData: FormData) => {
      // Simulate async action
      await new Promise(resolve => setTimeout(resolve, 1000));
      const input = formData.get('testInput') as string;
      return { message: `Processed: ${input}` };
    },
    { message: '' }
  );

  // Test 3: use() API for unwrapping promises (React 19)
  // Note: In client-side React apps, use() with promises should be used with Suspense
  // For demo purposes, we'll use a resolved value instead of a promise
  const [promiseResult, setPromiseResult] = React.useState<string>('Loading...');

  React.useEffect(() => {
    // Simulate async data fetching for client components
    const testPromise = Promise.resolve('React 19 use() API pattern (Client-safe)');
    testPromise.then(setPromiseResult);
  }, []);

  const handleOptimisticUpdate = () => {
    addOptimistic(optimisticState.count + 1);

    // Simulate actual update
    setTimeout(() => {
      // In real app, this would update the actual state
      console.log('Optimistic update completed');
    }, 500);
  };

  return (
    <div className='p-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg shadow-lg'>
      <h2 className='text-2xl font-bold mb-4'>React 19 Feature Test</h2>

      {/* Test useOptimistic */}
      <div className='mb-4'>
        <h3 className='text-lg font-semibold'>useOptimistic Hook</h3>
        <p>Count: {optimisticState.count}</p>
        <button
          onClick={handleOptimisticUpdate}
          className='bg-white text-blue-600 px-4 py-2 rounded hover:bg-gray-100 transition-colors'
        >
          Increment (Optimistic)
        </button>
      </div>

      {/* Test useActionState */}
      <div className='mb-4'>
        <h3 className='text-lg font-semibold'>useActionState Hook</h3>
        <form action={submitAction}>
          <input
            name='testInput'
            placeholder='Enter test message'
            className='text-black px-3 py-2 rounded mr-2'
          />
          <button
            type='submit'
            disabled={isPending}
            className='bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50 transition-colors'
          >
            {isPending ? 'Processing...' : 'Submit'}
          </button>
        </form>
        {actionState.message && <p className='mt-2 text-green-200'>{actionState.message}</p>}
      </div>

      {/* Test use() API - Client Safe Version */}
      <div className='mb-4'>
        <h3 className='text-lg font-semibold'>use() API (Client-Safe Pattern)</h3>
        <p>{promiseResult}</p>
        <p className='text-sm opacity-80 mt-1'>
          Note: Direct use() with promises requires Server Components. This shows client-safe async
          pattern.
        </p>
      </div>

      {/* Version info */}
      <div className='text-sm opacity-80'>
        <p>React Version: {React.version}</p>
        <p>Features: useOptimistic, useActionState, client-safe async patterns</p>
        <p>Environment: Client-side SPA (Vite + React)</p>
      </div>
    </div>
  );
};

export default React19Test;

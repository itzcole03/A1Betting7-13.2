/**
 * React 19 Comprehensive Test Component
 * Demonstrates proper React 19 patterns for client-side applications
 * Shows the differences between Server Component and Client Component patterns
 */

import React, { Suspense } from 'react';

// Component that demonstrates use() API with a promise
const UseApiDemo: React.FC = () => {
  // Create a promise that resolves to data
  const dataPromise = React.useMemo(
    () =>
      new Promise<string>(resolve =>
        setTimeout(() => resolve('Data loaded with use() API in Suspense!'), 1000)
      ),
    []
  );

  // Use the use() API with the promise directly
  const data = React.use(dataPromise) as string;

  return (
    <div className='p-3 bg-green-100 rounded border'>
      <h4 className='font-semibold text-green-800'>use() API with Suspense</h4>
      <p className='text-green-700'>{data}</p>
    </div>
  );
};

// Main comprehensive demo component
export const React19Comprehensive: React.FC = () => {
  // Test 1: useOptimistic hook (React 19)
  const [optimisticState, addOptimistic] = React.useOptimistic(
    { count: 0, items: [] as string[] },
    (state, action: { type: 'increment' } | { type: 'addItem'; item: string }) => {
      if (action.type === 'increment') {
        return { ...state, count: state.count + 1 };
      } else {
        return { ...state, items: [...state.items, action.item] };
      }
    }
  );

  // Test 2: useActionState hook (React 19)
  const [actionState, submitAction, isPending] = React.useActionState(
    async (prevState: { message: string; count: number }, formData: FormData) => {
      // Simulate async action
      await new Promise(resolve => setTimeout(resolve, 1000));
      const input = formData.get('testInput') as string;
      return {
        message: input ? `Processed: ${input}` : 'No input provided',
        count: prevState.count + 1,
      };
    },
    { message: '', count: 0 }
  );

  // Test 3: Client-side async state management (traditional pattern)
  const [asyncData, setAsyncData] = React.useState<string>('Loading...');
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const loadData = async () => {
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));
        setAsyncData('Client-side async data loaded successfully!');
      } catch (err) {
        setError('Failed to load data');
      }
    };
    loadData();
  }, []);

  const handleOptimisticIncrement = () => {
    React.startTransition(() => {
      addOptimistic({ type: 'increment' });
    });

    // Simulate actual update
    setTimeout(() => {
      console.log('Optimistic increment completed');
    }, 500);
  };

  const handleOptimisticAddItem = () => {
    const newItem = `Item ${optimisticState.items.length + 1}`;
    React.startTransition(() => {
      addOptimistic({ type: 'addItem', item: newItem });
    });

    // Simulate actual update
    setTimeout(() => {
      console.log('Optimistic item add completed');
    }, 500);
  };

  return (
    <div className='p-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg shadow-lg space-y-6'>
      <h2 className='text-2xl font-bold'>React 19 Comprehensive Demo</h2>

      {/* useOptimistic Demo */}
      <div className='bg-white/10 p-4 rounded'>
        <h3 className='text-lg font-semibold mb-3'>useOptimistic Hook</h3>
        <div className='space-y-2'>
          <p>Count: {optimisticState.count}</p>
          <p>Items: {optimisticState.items.join(', ') || 'None'}</p>
          <div className='space-x-2'>
            <button
              onClick={handleOptimisticIncrement}
              className='bg-white text-blue-600 px-3 py-1 rounded hover:bg-gray-100 transition-colors'
            >
              Increment
            </button>
            <button
              onClick={handleOptimisticAddItem}
              className='bg-white text-blue-600 px-3 py-1 rounded hover:bg-gray-100 transition-colors'
            >
              Add Item
            </button>
          </div>
          <p className='text-sm opacity-80 mt-2'>
            Note: Optimistic updates are wrapped in startTransition() to prevent React 19 warnings.
          </p>
        </div>
      </div>

      {/* useActionState Demo */}
      <div className='bg-white/10 p-4 rounded'>
        <h3 className='text-lg font-semibold mb-3'>useActionState Hook</h3>
        <form action={submitAction} className='space-y-2'>
          <div>
            <input
              name='testInput'
              placeholder='Enter test message'
              className='text-black px-3 py-2 rounded w-full'
            />
          </div>
          <button
            type='submit'
            disabled={isPending}
            className='bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50 transition-colors'
          >
            {isPending ? 'Processing...' : 'Submit'}
          </button>
        </form>
        <div className='mt-2 space-y-1'>
          {actionState.message && <p className='text-green-200'>Message: {actionState.message}</p>}
          <p className='text-sm opacity-80'>Submissions: {actionState.count}</p>
        </div>
      </div>

      {/* use() API with Suspense */}
      <div className='bg-white/10 p-4 rounded'>
        <h3 className='text-lg font-semibold mb-3'>use() API with Suspense</h3>
        <Suspense fallback={<div className='p-3 bg-yellow-100 rounded'>Loading use() data...</div>}>
          <UseApiDemo />
        </Suspense>
        <p className='text-sm opacity-80 mt-2'>
          This demonstrates the proper use() API pattern with Suspense for client components.
        </p>
      </div>

      {/* Traditional async pattern */}
      <div className='bg-white/10 p-4 rounded'>
        <h3 className='text-lg font-semibold mb-3'>Traditional Async Pattern</h3>
        {error ? <p className='text-red-200'>Error: {error}</p> : <p>{asyncData}</p>}
        <p className='text-sm opacity-80 mt-2'>
          Traditional useEffect + useState pattern for async data in client components.
        </p>
      </div>

      {/* Information */}
      <div className='text-sm opacity-80 bg-white/10 p-4 rounded'>
        <p className='font-semibold mb-2'>React 19 Patterns Explained:</p>
        <ul className='list-disc list-inside space-y-1'>
          <li>
            <strong>useOptimistic:</strong> For optimistic UI updates
          </li>
          <li>
            <strong>useActionState:</strong> For form actions with pending states
          </li>
          <li>
            <strong>use() with Suspense:</strong> For unwrapping promises (requires Suspense
            boundary)
          </li>
          <li>
            <strong>Traditional patterns:</strong> Still valid for client-side async operations
          </li>
        </ul>
        <p className='mt-2'>
          <strong>Environment:</strong> Client-side SPA (Vite + React {React.version})
        </p>
      </div>
    </div>
  );
};

export default React19Comprehensive;

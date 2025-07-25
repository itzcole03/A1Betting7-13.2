import { useState } from 'react';
// @ts-expect-error TS(6142): Module '../auth/AuthContext' was resolved to 'C:/U... Remove this comment to see the full error message
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const _Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // @ts-expect-error TS(2339): Property 'login' does not exist on type 'unknown'.
  const { login } = useAuth();
  const _navigate = useNavigate();

  const _handleChange = (e: unknown) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const _handleSubmit = async (e: unknown) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const _result = await login(formData.username, formData.password);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  return (
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <div className='min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8'>
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove
      this comment to see the full error message
      <div className='max-w-md w-full space-y-8'>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove
        this comment to see the full error message
        <div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <h2 className='mt-6 text-center text-3xl font-extrabold text-gray-900'>
            Sign in to A1Betting
          </h2>
        </div>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove
        this comment to see the full error message
        <form className='mt-8 space-y-6' onSubmit={handleSubmit}>
          {error && (
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded'>
              {error}
            </div>
          )}
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <label htmlFor='username' className='sr-only'>
              Username or Email
            </label>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <input
              id='username'
              name='username'
              type='text'
              required
              className='appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm'
              placeholder='Username or Email'
              value={formData.username}
              onChange={handleChange}
            />
          </div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <label htmlFor='password' className='sr-only'>
              Password
            </label>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <input
              id='password'
              name='password'
              type='password'
              required
              className='appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm'
              placeholder='Password'
              value={formData.password}
              onChange={handleChange}
            />
          </div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <button
              type='submit'
              disabled={loading}
              className='group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50'
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <div className='text-center'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <span className='text-sm text-gray-600'>
              Don't have an account? // @ts-expect-error TS(17004): Cannot use JSX unless the
              '--jsx' flag is provided... Remove this comment to see the full error message
              <button
                type='button'
                className='font-medium text-indigo-600 hover:text-indigo-500'
                onClick={() => navigate('/register')}
              >
                Sign up
              </button>
            </span>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;

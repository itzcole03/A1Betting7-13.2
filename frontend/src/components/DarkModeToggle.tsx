import { useEffect, useState } from 'react';

const _DarkModeToggle = () => {
  const [dark, setDark] = useState(() => {
    // Prefer user setting, fallback to system preference;
    if (typeof window !== 'undefined') {
      const _stored = localStorage.getItem('theme');
      if (stored) return stored === 'dark';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [dark]);

  // Sync with system preference changes;
  useEffect(() => {
    const _mq = window.matchMedia('(prefers-color-scheme: dark)');
    const _handler = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem('theme')) setDark(e.matches);
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return (
    <button
      className='ml-2 px-2 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600'
      onClick={() => setDark(d => !d)}
      title='Toggle dark mode'
    >
      {dark ? '🌙' : '☀️'}
    </button>
  );
};

export default DarkModeToggle;

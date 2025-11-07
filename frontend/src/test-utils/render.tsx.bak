// import types or values from theme if needed
import { MantineProvider, createTheme, mergeThemeOverrides } from '@mantine/core';
import { render as testingLibraryRender } from '@testing-library/react';

const dummyTheme = createTheme({
  // Define a minimal theme for testing to avoid import issues
  fontFamily: 'sans-serif',
  colors: {
    dark: ['#000', '#111', '#222', '#333', '#444', '#555', '#666', '#777', '#888', '#999'],
    gray: ['#aaa', '#bbb', '#ccc', '#ddd', '#eee', '#fff', '#000', '#111', '#222', '#333'],
  },
  primaryColor: 'blue',
  components: {
    Modal: {
      defaultProps: {
        transitionProps: { duration: 0 },
      },
    },
  },
});

const testTheme = mergeThemeOverrides(
  dummyTheme, // Use the dummy theme
  createTheme({
    components: {
      Modal: {
        defaultProps: {
          transitionProps: { duration: 0 },
        },
      },
    },
  })
);

export function render(ui: React.ReactNode) {
  return testingLibraryRender(<>{ui}</>, {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <MantineProvider theme={testTheme} env='test'>
        {children}
      </MantineProvider>
    ),
  });
}

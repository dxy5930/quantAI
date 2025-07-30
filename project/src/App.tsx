import React from 'react';
import { AppRouter } from './router';
import { ThemeProvider } from './components/common/ThemeProvider';
import { ErrorBoundary } from './components/common/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AppRouter />
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
import React, { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './store/authStore';
import ErrorBoundary from './components/ErrorBoundary';

const queryClient = new QueryClient();

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-300">Initializing application...</p>
      </div>
    </div>
  );
}

function AuthInitializer({ children }) {
  const { initializeAuth, isInitialized } = useAuthStore();

  React.useEffect(() => {
    const unsubscribe = initializeAuth();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [initializeAuth]);

  if (!isInitialized) {
    return <LoadingScreen />;
  }

  return children;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthInitializer>
          <App />
        </AuthInitializer>
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)

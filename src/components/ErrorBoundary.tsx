import { Component, ErrorInfo, ReactNode, useEffect, useState } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { clsx } from 'clsx';
import { useNavigate } from 'react-router-dom';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

// UI component that can use hooks (useNavigate)
function ErrorBoundaryUI({
  error,
  onRetry,
  onGoHome,
}: {
  error: Error | null;
  onRetry: () => void;
  onGoHome: () => void;
}) {
  return (
    <div className="flex min-h-[400px] items-center justify-center p-8">
      <div className="w-full max-w-md text-center">
        <div
          className={clsx(
            'mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full',
            'bg-red-100 text-red-600'
          )}
        >
          <AlertTriangle className="h-8 w-8" aria-hidden="true" />
        </div>
        <h2 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
          Une erreur est survenue
        </h2>
        <p className="mb-6 text-gray-600 dark:text-gray-400">
          Une erreur inattendue s'est produite. L'application ne peut pas continuer.
        </p>
        {error && (
          <details className="mb-6 text-left">
            <summary className="cursor-pointer text-sm font-medium text-gray-600 dark:text-gray-400">
              Détails techniques
            </summary>
            <pre
              className={clsx(
                'mt-2 overflow-auto rounded bg-gray-100 p-3 text-xs dark:bg-gray-800',
                'text-red-700 dark:text-red-300'
              )}
            >
              {error.message}
              {error.stack && `\n\n${error.stack}`}
            </pre>
          </details>
        )}
        <div className="flex justify-center gap-3">
          <button
            type="button"
            onClick={onRetry}
            className={clsx(
              'inline-flex items-center gap-2 rounded-lg px-4 py-2 font-medium transition-colors',
              'bg-primary-600 text-white hover:bg-primary-700'
            )}
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Réessayer
          </button>
          <button
            type="button"
            onClick={onGoHome}
            className={clsx(
              'inline-flex items-center gap-2 rounded-lg px-4 py-2 font-medium transition-colors',
              'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'
            )}
          >
            <Home className="h-4 w-4" aria-hidden="true" />
            Accueil
          </button>
        </div>
      </div>
    </div>
  );
}

// Wrapper component that uses useNavigate and renders the UI
function ErrorBoundaryWithNavigate({
  error,
  onRetry,
}: {
  error: Error | null;
  onRetry: () => void;
}) {
  const navigate = useNavigate();
  return <ErrorBoundaryUI error={error} onRetry={onRetry} onGoHome={() => navigate('/')} />;
}

// Class component for actual error boundary (required for getDerivedStateFromError)
export class ErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false, error: null };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    console.log('[ErrorBoundary] render, hasError:', this.state.hasError);
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Use the functional component with hooks for navigation
      return <ErrorBoundaryWithNavigate error={this.state.error} onRetry={this.handleRetry} />;
    }

    console.log('[ErrorBoundary] rendering children');
    return this.props.children;
  }
}

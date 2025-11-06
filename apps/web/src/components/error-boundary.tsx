import { Component, type ReactNode } from 'react';

/**
 * Props for the ErrorBoundary component
 */
interface ErrorBoundaryProps {
    children: ReactNode;
    fallback?: ReactNode;
}

/**
 * State for the ErrorBoundary component
 */
interface ErrorBoundaryState {
    hasError: boolean;
    error?: Error;
}

/**
 * Error boundary component that catches JavaScript errors anywhere in the child component tree
 *
 * This component prevents the entire app from crashing when a component throws an error.
 * Instead, it displays a fallback UI and logs the error.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false };
    }

    /**
     * Update state when an error is caught
     */
    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    /**
     * Log error details when an error is caught
     */
    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('Error boundary caught an error:', error, errorInfo);
        // TODO: Send to error tracking service (e.g., Sentry) when available
    }

    /**
     * Reset error state to allow retry
     */
    private handleReset = () => {
        this.setState({ hasError: false, error: undefined });
    };

    /**
     * Reload the entire page
     */
    private handleReload = () => {
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            // Use custom fallback if provided
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // Default fallback UI
            return (
                <div className="flex min-h-screen items-center justify-center bg-background px-4">
                    <div className="border-border bg-card w-full max-w-md rounded-lg border p-8 shadow-lg">
                        <div className="mb-6 text-center">
                            <h1 className="mb-2 text-2xl font-bold text-foreground">Something went wrong</h1>
                            <p className="text-muted-foreground text-sm">
                                An unexpected error occurred. Please try reloading the page.
                            </p>
                        </div>

                        {this.state.error && (
                            <div className="border-destructive/50 bg-destructive/10 mb-6 rounded border p-4">
                                <p className="text-destructive text-sm font-medium">Error Details:</p>
                                <p className="text-destructive/80 mt-2 font-mono text-xs">{this.state.error.message}</p>
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={this.handleReset}
                                className="flex-1 rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80"
                            >
                                Try Again
                            </button>
                            <button
                                onClick={this.handleReload}
                                className="flex-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                            >
                                Reload Page
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

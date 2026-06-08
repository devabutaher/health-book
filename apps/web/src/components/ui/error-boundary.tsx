"use client";

import { Component, type ComponentType, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  FallbackComponent?: ComponentType<{ error: Error; onReset: () => void }>;
  onError?: (error: Error, errorInfo: { componentStack: string }) => void;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: { componentStack: string }) {
    this.props.onError?.(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      if (this.props.FallbackComponent) {
        const Fallback = this.props.FallbackComponent;
        return <Fallback error={this.state.error} onReset={this.handleReset} />;
      }
      return (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-destructive/20 bg-destructive/5 p-8 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="size-6 text-destructive" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Something went wrong</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {this.state.error.message || "An unexpected error occurred"}
            </p>
          </div>
          <button
            onClick={this.handleReset}
            className="inline-flex items-center gap-1.5 rounded-lg bg-foreground/10 px-4 py-2 text-xs font-medium text-foreground transition-colors hover:bg-foreground/20"
          >
            <RefreshCw className="size-3.5" />
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

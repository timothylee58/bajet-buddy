"use client";

import React from "react";

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, info: React.ErrorInfo) => void;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, info);
    this.props.onError?.(error, info);
  }

  private reset = () => {
    this.props.onReset?.();
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    if (this.props.fallback) return this.props.fallback;

    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-danger/20 bg-danger/5 p-8 text-center">
        <span className="text-4xl">😵</span>
        <div>
          <p className="font-semibold text-foreground">Something went wrong</p>
          <p className="mt-1 text-sm text-muted">
            {this.state.error?.message ?? "An unexpected error occurred."}
          </p>
        </div>
        <button
          onClick={this.reset}
          className="rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          Try again
        </button>
      </div>
    );
  }
}

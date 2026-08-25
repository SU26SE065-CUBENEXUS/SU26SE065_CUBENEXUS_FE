'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ArenaErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ArenaErrorBoundary] Caught render error:', error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="bg-card/90 border border-border/80 rounded-3xl p-6 shadow-xl flex flex-col items-center justify-center text-center space-y-4 max-w-md mx-auto my-8">
          <div className="h-12 w-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
              {this.props.fallbackTitle || 'Component Render Issue'}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {this.state.error?.message || 'A temporary display issue occurred while loading this phase.'}
            </p>
          </div>
          <button
            onClick={this.handleRetry}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer shadow-md shadow-orange-500/20"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Retry Display
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

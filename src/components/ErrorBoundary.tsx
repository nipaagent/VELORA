import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 p-4 font-sans text-slate-800">
          <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-100 p-6 sm:p-8 text-center space-y-5">
            <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto border border-rose-100 shadow-sm">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">একটি সমস্যা দেখা দিয়েছে</h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                অ্যাপ্লিকেশনে সাময়িক সমস্যা হয়েছে। আপনি পেজটি রিলোড করতে পারেন অথবা আবার চেষ্টা করতে পারেন।
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 text-left font-mono break-all max-h-24 overflow-y-auto">
                {this.state.error.message}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold transition-all active:scale-98 flex items-center justify-center gap-2"
              >
                <Home className="w-4 h-4" />
                <span>আবার চেষ্টা করুন</span>
              </button>
              <button
                type="button"
                onClick={this.handleReload}
                className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-indigo-100 transition-all active:scale-98 flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>পেজ রিলোড</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

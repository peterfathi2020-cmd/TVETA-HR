import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      let errorMessage = "حدث خطأ غير متوقع في النظام.";
      let isPermissionError = false;

      try {
        if (this.state.error?.message) {
          const parsed = JSON.parse(this.state.error.message);
          if (parsed.error && parsed.error.includes('permissions')) {
            isPermissionError = true;
            errorMessage = "عذراً، ليس لديك الصلاحيات الكافية لإتمام هذه العملية أو الوصول لهذه البيانات.";
          }
        }
      } catch (e) {
        // Not a JSON error
        if (this.state.error?.message.includes('permissions')) {
          isPermissionError = true;
          errorMessage = "عذراً، ليس لديك الصلاحيات الكافية لإتمام هذه العملية.";
        }
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
          <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-8 text-center border border-slate-200 dark:border-slate-700">
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="text-red-600 dark:text-red-500" size={40} />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">
              {isPermissionError ? "خطأ في الصلاحيات" : "حدث خطأ ما"}
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
              {errorMessage}
            </p>
            <button
              onClick={this.handleReset}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw size={20} />
              إعادة تحميل الصفحة
            </button>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mt-6 p-4 bg-slate-100 dark:bg-slate-900 rounded-xl text-left overflow-auto max-h-40">
                <pre className="text-xs text-slate-500 font-mono">
                  {this.state.error.message}
                </pre>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

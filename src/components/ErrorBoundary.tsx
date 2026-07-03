import React, { ReactNode } from "react";
import { AlertOctagon, RotateCcw } from "lucide-react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error caught by MelodyStream ErrorBoundary:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public override render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col min-h-screen bg-black items-center justify-center font-sans p-6 text-center select-none">
          <div className="bg-[#121212] border border-[#282828] p-8 max-w-md w-full rounded-2xl shadow-2xl relative space-y-6 overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-red-600/10 rounded-full blur-[60px] pointer-events-none" />
            
            <div className="w-16 h-16 mx-auto bg-red-500/10 text-red-500 rounded-full flex items-center justify-center border border-red-500/20">
              <AlertOctagon className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-2xl font-extrabold text-white tracking-tight">
                Oops! Something went wrong
              </h2>
              <p className="text-[#a78bfa] text-xs font-bold uppercase tracking-wider mt-1">
                MelodyStream Guard Active
              </p>
            </div>

            <p className="text-gray-400 text-sm leading-relaxed">
              We encountered an unexpected application error. Don't worry, your music library and local playlists are safe.
            </p>

            {this.state.error && (
              <div className="bg-black/60 border border-[#282828] p-3 rounded-lg text-left text-xs font-mono text-red-400 max-h-24 overflow-y-auto custom-scrollbar">
                {this.state.error.message}
              </div>
            )}

            <button
              onClick={this.handleReset}
              className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#8b5cf6] to-[#ec4899] text-white font-extrabold hover:scale-[1.02] active:scale-[0.98] transition-all text-sm shadow-[0_0_20px_rgba(139,92,246,0.3)] flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
export default ErrorBoundary;

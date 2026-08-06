import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  public state: State = { 
    hasError: false, 
    error: null 
  };

  constructor(props: Props) {
    super(props);
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8 text-center font-mono uppercase italic">
          <h1 className="text-4xl font-black mb-4 tracking-tighter text-red-500">System Error</h1>
          <code className="text-[10px] text-red-300 mb-8">{this.state.error?.message}</code>
          <button onClick={() => window.location.reload()} className="px-8 py-4 bg-red-600 text-white font-black rounded-2xl">RETRY</button>
        </div>
      );
    }
    return (this as any).props.children;
  }
}

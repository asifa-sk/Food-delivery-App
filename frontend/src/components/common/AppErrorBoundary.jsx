import React from 'react';

export default class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('app render failed', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-hero-warm px-4 py-10">
          <div className="mx-auto max-w-3xl rounded-[2rem] border border-red-200 bg-white p-8 shadow-float">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-500">App Error</p>
            <h1 className="mt-3 text-3xl font-black text-slate-900">Something is crashing during startup</h1>
            <p className="mt-3 text-sm text-slate-600">
              The actual error is shown below so we can fix it directly.
            </p>

            <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 p-4">
              <p className="text-sm font-semibold text-red-700">
                {this.state.error?.message || 'Unknown render error'}
              </p>
              {this.state.error?.stack ? (
                <pre className="mt-3 overflow-auto whitespace-pre-wrap text-xs text-red-900">
                  {this.state.error.stack}
                </pre>
              ) : null}
            </div>

            <button
              type="button"
              onClick={this.handleReload}
              className="mt-6 rounded-2xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white"
            >
              Reload App
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// src/main.jsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import Api from './api'; // centralized API client (initSocket available)
import './index.css'; // Tailwind + global styles
import './utils/boots'; // optional bootstrapping (polyfills) - create if needed

// Optional: ErrorBoundary component (simple)
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // log to console / external monitoring here
    // e.g., Sentry.captureException(error, { extra: info });
    console.error('Uncaught error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
          <div className="max-w-lg text-center bg-white shadow-soft rounded-md p-6">
            <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
            <p className="text-sm text-slate-600 mb-4">An unexpected error occurred. Please reload the page.</p>
            <pre className="text-xs text-left bg-slate-100 p-3 rounded overflow-auto">{String(this.state.error)}</pre>
            <div className="mt-4">
              <button onClick={() => location.reload()} className="px-4 py-2 bg-blue-600 text-white rounded">Reload</button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Initialize socket (if API supports it) to enable realtime session updates etc.
// This is optional and will quietly fail if socket.io-client not available.
try {
  if (Api && typeof Api.initSocket === 'function') {
    Api.initSocket();
  }
} catch (e) {
  // don't break app if socket init fails
  // console.debug('Socket init skipped:', e);
}

// Set a sensible document title
if (!document.title || document.title === 'React App') {
  document.title = 'Hybrid MLM — Dashboard';
}

// Create app root
const container = document.getElementById('root');
if (!container) {
  // If root element missing, create one and append
  const el = document.createElement('div');
  el.id = 'root';
  document.body.appendChild(el);
}

// Render
const root = createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);

// Hot module replacement: accept updates to App during dev
if (import.meta && import.meta.hot) {
  import.meta.hot.accept('./App', () => {
    // re-import and re-render if App changes
    // eslint-disable-next-line global-require
    const NextApp = require('./App').default;
    root.render(
      <React.StrictMode>
        <ErrorBoundary>
          <NextApp />
        </ErrorBoundary>
      </React.StrictMode>
    );
  });
}

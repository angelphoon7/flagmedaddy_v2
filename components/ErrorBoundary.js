import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Check if this is a browser extension error
    if (error.message && (
      error.message.includes('Extension ID') || 
      error.message.includes('runtime.sendMessage') ||
      error.message.includes('chrome.runtime')
    )) {
      return { 
        hasError: true, 
        error: {
          type: 'extension',
          message: 'Browser extension conflict detected'
        }
      };
    }
    
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.state.error?.type === 'extension') {
        return (
          <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-100 py-12 px-4">
            <div className="max-w-2xl mx-auto text-center">
              <div className="bg-white rounded-lg shadow-md p-8">
                <div className="text-4xl mb-4">⚠️</div>
                <h1 className="text-2xl font-bold text-gray-800 mb-4">Browser Extension Conflict</h1>
                <p className="text-gray-600 mb-6">
                  A browser extension is causing conflicts with the wallet connection.
                </p>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-yellow-800 mb-2">Quick Solutions:</h3>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li>• Refresh the page</li>
                    <li>• Temporarily disable other wallet extensions</li>
                    <li>• Try using an incognito/private window</li>
                    <li>• Clear browser cache and cookies</li>
                  </ul>
                </div>
                
                <button
                  onClick={() => window.location.reload()}
                  className="bg-rose-500 hover:bg-rose-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
                >
                  🔄 Refresh Page
                </button>
              </div>
            </div>
          </div>
        );
      }
      
      return (
        <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-100 py-12 px-4">
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-white rounded-lg shadow-md p-8">
              <div className="text-4xl mb-4">💔</div>
              <h1 className="text-2xl font-bold text-gray-800 mb-4">Something went wrong</h1>
              <p className="text-gray-600 mb-6">
                An unexpected error occurred. Please try refreshing the page.
              </p>
              
              <button
                onClick={() => window.location.reload()}
                className="bg-rose-500 hover:bg-rose-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
              >
                🔄 Refresh Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 
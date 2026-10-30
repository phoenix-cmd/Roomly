import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in React ErrorBoundary:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#FAF8F5',
            padding: '24px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              maxWidth: '540px',
              padding: '48px 32px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2DBD0',
              borderRadius: '4px',
              boxShadow: '0 8px 30px rgba(36, 35, 31, 0.07)',
            }}
          >
            <div
              style={{
                fontSize: '0.8rem',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: '#B69A68',
                fontWeight: 600,
                marginBottom: '12px',
              }}
            >
              System Notice
            </div>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '2.25rem', marginBottom: '16px', color: '#24231F' }}>
              Unexpected Horizon Disruption
            </h2>
            <p style={{ color: '#6B685F', lineHeight: '1.7', marginBottom: '32px' }}>
              Our concierge platform encountered a momentary obstacle while rendering this view.
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.href = '/';
              }}
              style={{
                backgroundColor: '#24231F',
                color: '#F7F3EC',
                border: 'none',
                padding: '12px 28px',
                fontSize: '0.85rem',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                borderRadius: '2px',
                cursor: 'pointer',
              }}
            >
              Return to Sanctuary Home
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;


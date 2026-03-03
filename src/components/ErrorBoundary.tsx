import React, { Component, ReactNode } from 'react';
import { Message, Container, Button } from 'semantic-ui-react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <Container style={{ marginTop: '2em' }}>
          <Message negative>
            <Message.Header>Something went wrong</Message.Header>
            <p>
              We're sorry, but something unexpected happened. Please try refreshing the page.
            </p>
            {this.state.error && (
              <details style={{ marginTop: '1em' }}>
                <summary>Error details</summary>
                <pre style={{ marginTop: '0.5em', fontSize: '0.9em' }}>
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
          </Message>
          <Button primary onClick={this.handleReset}>
            Reload Page
          </Button>
        </Container>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

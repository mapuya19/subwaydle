import React from 'react';
import PropTypes from 'prop-types';
import { Message, Container, Button } from 'semantic-ui-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
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

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
};

export default ErrorBoundary;

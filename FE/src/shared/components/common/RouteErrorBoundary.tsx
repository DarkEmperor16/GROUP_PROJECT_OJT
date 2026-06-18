import { Component, type ErrorInfo, type ReactNode } from "react";
import { ErrorState } from "@/shared/components/common/StatusStates";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage?: string;
}

export default class RouteErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[UI] Route error:", error, info);
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.children !== this.props.children && this.state.hasError) {
      this.setState({ hasError: false, errorMessage: undefined });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorState
          message={
            import.meta.env.DEV && this.state.errorMessage
              ? this.state.errorMessage
              : "This page failed to load. Please refresh and try again."
          }
          onRetry={() =>
            this.setState({ hasError: false, errorMessage: undefined })
          }
        />
      );
    }

    return this.props.children;
  }
}

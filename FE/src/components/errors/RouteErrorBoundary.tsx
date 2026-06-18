import { Component, type ErrorInfo, type ReactNode } from "react";
import { ErrorState } from "@/components/ui/StatusStates";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class RouteErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[UI] Route error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorState
          message="This page failed to load. Please refresh and try again."
          onRetry={() => window.location.reload()}
        />
      );
    }

    return this.props.children;
  }
}

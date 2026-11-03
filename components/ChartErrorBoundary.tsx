"use client";

import { Component, type ReactNode } from "react";

type Props = { children: ReactNode };
type State = { error: Error | null };

/**
 * Catches a rendering error inside the chart so a bad frame (malformed catalog
 * entry, projection edge case) degrades to a message instead of a white screen.
 * Class component because React has no hook equivalent of componentDidCatch.
 */
export class ChartErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error("Sky chart failed to render", error);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="chart-error" role="alert">
        <p>The sky chart hit an error and could not be drawn.</p>
        <p className="chart-error-detail">{this.state.error.message}</p>
        <button type="button" className="toggle" onClick={() => this.setState({ error: null })}>
          Try again
        </button>
      </div>
    );
  }
}

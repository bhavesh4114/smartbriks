import React from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router";
import { router } from "./app/routes";
import "./styles/index.css";

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("Root element #root not found");

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 24, fontFamily: "sans-serif", color: "#c00" }}>
          <h1>App error</h1>
          <pre>{this.state.error.message}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(rootEl).render(
  <ErrorBoundary>
    <div id="app-root">
      <RouterProvider router={router} />
    </div>
  </ErrorBoundary>
);
  
import type { ReactNode } from "react";
import "./AuthLayout.css";

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="auth-layout">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="auth-brand-mark">◧</span>
          <span>Task Tracker</span>
        </div>
        {children}
      </div>
    </div>
  );
}

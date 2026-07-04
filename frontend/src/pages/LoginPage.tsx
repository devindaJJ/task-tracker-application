import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { getErrorMessage } from "../api/errors";
import { AuthLayout } from "../components/AuthLayout";
import "../components/form.css";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login({ email, password });
      navigate("/tasks");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout>
      <h1>Log in</h1>
      <p style={{ color: "var(--color-ink-soft)", fontSize: 14, marginTop: 6, marginBottom: 24 }}>
        Welcome back. Enter your details to continue.
      </p>

      <form onSubmit={handleSubmit}>
        {error && <div className="form-banner-error">{error}</div>}

        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>

        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>

        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
          {isSubmitting ? "Logging in…" : "Log in"}
        </button>
      </form>

      <p className="auth-switch">
        Don't have an account? <Link to="/register">Sign up</Link>
      </p>
    </AuthLayout>
  );
}

import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { getErrorMessage } from "../api/errors";
import { AuthLayout } from "../components/AuthLayout";
import "../components/form.css";

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setIsSubmitting(true);
    try {
      await register({ email, full_name: fullName, password });
      navigate("/tasks");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout>
      <h1>Create an account</h1>
      <p style={{ color: "var(--color-ink-soft)", fontSize: 14, marginTop: 6, marginBottom: 24 }}>
        Start tracking tasks in seconds.
      </p>

      <form onSubmit={handleSubmit}>
        {error && <div className="form-banner-error">{error}</div>}

        <div className="field">
          <label htmlFor="full_name">Full name</label>
          <input
            id="full_name"
            type="text"
            required
            autoComplete="name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Alex Rivera"
          />
        </div>

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
            autoComplete="new-password"
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
          />
        </div>

        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
          {isSubmitting ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="auth-switch">
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </AuthLayout>
  );
}

import { useAuth } from "../auth/AuthContext";
import "./Navbar.css";

export function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="navbar">
      <div className="navbar-brand">
        <span className="navbar-mark">◧</span>
        <span>Task Tracker</span>
      </div>

      {user && (
        <div className="navbar-user">
          <div className="navbar-user-info">
            <span className="navbar-user-name">{user.full_name}</span>
            <span className={`navbar-role-badge navbar-role-${user.role}`}>{user.role}</span>
          </div>
          <button className="btn btn-secondary" onClick={logout}>
            Log out
          </button>
        </div>
      )}
    </header>
  );
}

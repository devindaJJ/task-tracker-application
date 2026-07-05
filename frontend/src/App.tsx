import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import TasksPage from "./pages/TasksPage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/tasks"
        element={
          <ProtectedRoute>
            <TasksPage />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to="/tasks" replace />} />
      <Route path="*" element={<Navigate to="/tasks" replace />} />
    </Routes>
  );
}

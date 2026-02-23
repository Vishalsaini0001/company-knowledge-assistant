import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Shell       from "./components/Shell";
import Login       from "./pages/Login";
import Register    from "./pages/Register";
import Dashboard   from "./pages/Dashboard";
import Documents   from "./pages/Documents";
import Chat        from "./pages/Chat";
import Profile     from "./pages/Profile";
import Loader      from "./components/ui/Loader";

function Guard({ children }) {
  const { user, ready } = useAuth();
  if (!ready) return <Loader full />;
  return user ? children : <Navigate to="/login" replace />;
}

function Public({ children }) {
  const { user, ready } = useAuth();
  if (!ready) return <Loader full />;
  return user ? <Navigate to="/dashboard" replace /> : children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login"    element={<Public><Login    /></Public>} />
      <Route path="/register" element={<Public><Register /></Public>} />
      <Route path="/" element={<Guard><Shell /></Guard>}>
        <Route index                element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard"     element={<Dashboard />} />
        <Route path="documents"     element={<Documents />} />
        <Route path="chat"          element={<Chat />} />
        <Route path="profile"       element={<Profile />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import MainLayout from "./layout/MainLayout.jsx";
import PrivateRoute from "./utils/PrivateRoute.jsx";
import { useAuth } from "./context/AuthContext.jsx";
import Profile from "./pages/Profile.jsx";
import ChatPage from "./pages/ChatPage.jsx"; // create this (see below)

function App() {
  const { user } = useAuth();

  return (
    <Router>
      <Routes>
        {/* Public */}
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to="/" replace /> : <Register />} />

        {/* Protected: MainLayout wraps child routes */}
        <Route
          path="/"
          element={
            <PrivateRoute>
              <MainLayout />
            </PrivateRoute>
          }
        >
          {/* index -> chat page */}
          <Route index element={<ChatPage />} />

          {/* /profile -> profile page (still shows Navbar + Sidebar) */}
          <Route path="profile" element={<Profile />} />

          {/* add other pages here as nested children */}
        </Route>

        {/* fallback: redirect unknown to root or login */}
        <Route path="*" element={<Navigate to={user ? "/" : "/login"} replace />} />
      </Routes>
    </Router>
  );
}

export default App;

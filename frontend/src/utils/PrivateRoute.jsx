import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const PrivateRoute = ({ children }) => {
  const { user } = useAuth();

    // Add console.log for debugging
  console.log("PrivateRoute - Current user:", user);

   if (!user) {
    console.log("No user found, redirecting to login");
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default PrivateRoute;

import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function PrivateRoute({ children }) {
  const { user, token } = useAuth();

  // If user not logged in
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  // If logged in, load page
  return children;
}

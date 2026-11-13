import { Navigate } from "react-router-dom";

function ProtectedRoute({ children }) {
  const authData = localStorage.getItem("authData");

  if (!authData) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default ProtectedRoute;
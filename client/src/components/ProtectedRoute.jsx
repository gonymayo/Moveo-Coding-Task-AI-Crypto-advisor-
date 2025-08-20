import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { UserContext } from "../context/UserContext";

export default function ProtectedRoute({ children }) {
  const { user, loadingUser } = useContext(UserContext);
  const token = localStorage.getItem("token");

  if (loadingUser) return null; 

  if (!token || !user) return <Navigate to="/login" replace />;

  return children;
}

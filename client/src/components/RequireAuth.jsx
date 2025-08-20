import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { UserContext } from "../Context/userContext";

export default function RequireAuth({ children }) {
  const { user } = useContext(UserContext);

  // אם אין משתמש מחובר (למשל אין אימייל) נחזיר ל-login
  if (!user || !user.email) {
    return <Navigate to="/login" replace />;
  }

  // אם יש משתמש → נציג את התוכן שהעברנו (children)
  return children;
}

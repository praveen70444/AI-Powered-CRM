import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
const EMPLOYEE_ROLES = ["SALES_MANAGER", "SALES_EXECUTIVE", "SUPPORT_AGENT"];
function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (allowedRoles && allowedRoles.length > 0) {
    const isAllowed =
      allowedRoles.includes(user.role) ||
      (allowedRoles.includes("EMPLOYEE") &&
        EMPLOYEE_ROLES.includes(user.role));
    if (!isAllowed) {
      let fallback = "/employee";
      if (user.role === "SUPER_ADMIN") fallback = "/super-admin";
      else if (user.role === "ORG_ADMIN") fallback = "/organization";
      
      return <Navigate to={fallback} replace />;
    }
  }
  return children;
}
export default ProtectedRoute;

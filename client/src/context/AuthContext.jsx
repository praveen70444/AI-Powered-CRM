import { createContext, useContext, useState } from "react";
import { login as loginRequest } from "../services/authService";
const AuthContext = createContext(null);
const EMPLOYEE_ROLES = ["SALES_MANAGER", "SALES_EXECUTIVE", "SUPPORT_AGENT"];
const storedUser = (() => {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
})();
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(storedUser);
  const [token, setToken] = useState(
    localStorage.getItem("admin_token")
  );
  const [loading, setLoading] = useState(false);
  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await loginRequest(email, password);
      const { token, user } = response.data;
      localStorage.setItem("admin_token", token);
      localStorage.setItem("user", JSON.stringify(user));
      setToken(token);
      setUser(user);
      return {
        success: true,
        user,
        token,
      };
    } finally {
      setLoading(false);
    }
  };
  const logout = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  };
  const updateUser = (updates) => {
    setUser((previous) => {
      const nextUser = { ...previous, ...updates };
      localStorage.setItem("user", JSON.stringify(nextUser));
      return nextUser;
    });
  };
  const isOrgAdmin = user?.role === "ORG_ADMIN";
  const isEmployee = EMPLOYEE_ROLES.includes(user?.role);
  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        updateUser,
        isOrgAdmin,
        isEmployee,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
export const useAuth = () => {
  return useContext(AuthContext);
};

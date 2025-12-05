import { createContext, useContext, useEffect, useState } from "react";
import API from "../utils/axiosInstance";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(
    () => JSON.parse(localStorage.getItem("user")) || null
  );
  const [token, setToken] = useState(() => localStorage.getItem("token") || "");
  const [loading, setLoading] = useState(false);

  // ----------------------------------------
  // SIGNUP (NEW)
  // ----------------------------------------
  const signup = async (data) => {
    try {
      setLoading(true);
      const res = await API.post("/auth/signup", data);

      if (res.data.status) {
        const { token, user } = res.data;

        setUser(user);
        setToken(token);

        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));

        return { success: true };
      }

      return { success: false, message: res.data.message };
    } catch (err) {
      return {
        success: false,
        message:
          err?.response?.data?.message || "Signup failed. Please try again.",
      };
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------
  // LOGIN
  // ----------------------------------------
  const login = async (email, password) => {
    try {
      setLoading(true);
      const res = await API.post("/auth/login", { email, password });

      if (res.data.status) {
        const { token, user } = res.data;

        setUser(user);
        setToken(token);

        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));

        return { success: true };
      }

      return { success: false, message: res.data.message };
    } catch (err) {
      return {
        success: false,
        message:
          err?.response?.data?.message || "Login failed. Please try again.",
      };
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------
  // AUTO LOAD USER ON REFRESH
  // ----------------------------------------
  useEffect(() => {
    if (!token) return;

    API.get("/user/me")
      .then((res) => {
        setUser(res.data.user);
        localStorage.setItem("user", JSON.stringify(res.data.user));
      })
      .catch(() => logout());
  }, [token]);

  // ----------------------------------------
  // LOGOUT
  // ----------------------------------------
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setToken("");
    setUser(null);

    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        signup, // NEW
        login,
        logout,
        setUser,
        setToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

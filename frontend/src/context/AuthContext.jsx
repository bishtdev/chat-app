import { createContext, useContext, useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";


export const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem("userInfo");
      if (storedUser) {
        return JSON.parse(storedUser);
      }
      const token = localStorage.getItem("token");
      if (token) {
        const decoded = jwtDecode(token);
        // Fallback when only token exists; username/email unknown until next login
        return { id: decoded.id };
      }
      return null;
    } catch (error) {
      console.error("Error restoring auth state:", error);
      localStorage.removeItem("token");
      localStorage.removeItem("userInfo");
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem("token") || null;
  });

  const login = (userData) => {
    if (!userData?.token) return;

    try {
      const decoded = jwtDecode(userData.token);
      localStorage.setItem("token", userData.token);
      setToken(userData.token);

      const nextUser = {
        id: decoded.id,
        username: userData.username,
        email: userData.email,
      };
      localStorage.setItem("userInfo", JSON.stringify(nextUser));
      setUser(nextUser);
      console.log("Login successful, user:", nextUser);
    } catch (error) {
      console.error("Error decoding token during login:", error);
    }
  };

//update user profile
const updateUser = (updates) =>{
  setUser((prev) =>{
    const next = {...(prev || {}), ...updates};
    try {
      localStorage.setItem("userInfo", JSON.stringify(next))
    } catch (error) {
      console.error('error updating user', error)
    }
    return next;
  })
}

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
    localStorage.removeItem("userInfo");
  };

  useEffect(() => {
    console.log("AuthContext - Current user:", user);
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [loading, setLoading] = useState(true);

  // ----------------- Load User on App Start -----------------
  useEffect(() => {
    const fetchUser = async () => {
      if (token) {
        try {
          const res = await fetch("http://localhost:5000/api/profile", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (res.ok) {
            const data = await res.json();
            // ✅ expect { success:true, user:{...} }
            setUser(data.user || data);
            localStorage.setItem(
              "user",
              JSON.stringify(data.user || data)
            );
          } else {
            logout(); // token invalid
          }
        } catch (error) {
          console.error("Failed to fetch user:", error);
          logout();
        }
      }
      setLoading(false);
    };

    fetchUser();
  }, [token]);

  // ----------------- Keep token synced -----------------
  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token);
    } else {
      localStorage.removeItem("token");
    }
  }, [token]);

  // ----------------- Login -----------------
  const login = (userData, jwtToken) => {
    setUser(userData);
    setToken(jwtToken);
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("token", jwtToken);
  };

  // ----------------- Logout -----------------
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  return (
    <AuthContext.Provider
      value={{ user, setUser, token, setToken, login, logout, loading }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
}

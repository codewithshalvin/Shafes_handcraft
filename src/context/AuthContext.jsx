// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
// ❌ REMOVE THIS IMPORT - No longer needed
// import { GoogleOAuthProvider } from '@react-oauth/google';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

function AuthProviderInner({ children }) {
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
            // ✅ Profile endpoint now returns user data directly
            setUser(data);
            localStorage.setItem(
              "user",
              JSON.stringify(data)
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

  // ----------------- Regular Login -----------------
  const login = (userData, jwtToken) => {
    setUser(userData);
    setToken(jwtToken);
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("token", jwtToken);
  };

  // ----------------- Google Login -----------------
  const googleLogin = async (credentialResponse) => {
    try {
      setLoading(true);
      console.log('🔐 Google login initiated:', credentialResponse);

      // Send the credential to your backend for verification
      const response = await fetch('http://localhost:5000/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          credential: credentialResponse.credential,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Use the same login function to maintain consistency
        login(data.user, data.token);
        
        console.log('✅ Google login successful:', data.user);
        return { success: true, user: data.user };
      } else {
        const error = await response.json();
        console.error('❌ Google login failed:', error);
        return { success: false, error: error.message };
      }
    } catch (error) {
      console.error('❌ Google login error:', error);
      return { success: false, error: 'Google login failed. Please try again.' };
    } finally {
      setLoading(false);
    }
  };

  // ----------------- Logout -----------------
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  // ----------------- Check if user is authenticated -----------------
  const isAuthenticated = () => {
    return !!(user && token);
  };

  return (
    <AuthContext.Provider
      value={{ 
        user, 
        setUser, 
        token, 
        setToken, 
        login, 
        googleLogin,  // Add Google login function
        logout, 
        loading, 
        isAuthenticated 
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
}

// ✅ SIMPLIFIED - Remove GoogleOAuthProvider wrapper since it's in main.jsx
export function AuthProvider({ children }) {
  return <AuthProviderInner>{children}</AuthProviderInner>;
}

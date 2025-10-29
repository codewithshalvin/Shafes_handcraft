import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FaUser, FaLock } from "react-icons/fa";
import GoogleLoginButton from "../components/GoogleLoginButton";
import "./Auth.css";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedOption, setSelectedOption] = useState("user");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const endpoint =
        selectedOption === "admin"
          ? "http://localhost:5000/api/admin/login"
          : "http://localhost:5000/api/users/login";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role: selectedOption }),
      });

      const data = await res.json();

      if (res.ok) {
        if (selectedOption === "admin") {
          // For admin, store data in admin-specific localStorage keys
          localStorage.setItem("adminToken", data.token);
          localStorage.setItem("isAdmin", "true");
          localStorage.setItem("adminInfo", JSON.stringify(data.admin));
          
          console.log('✅ Admin login successful, redirecting to admin panel...');
          navigate("/admin");
        } else {
          // For user, store BOTH user info and JWT token
          login(
            {
              email: data.user.email,
              name: data.user.name,
              phone: data.user.phone,
              address: data.user.address,
              city: data.user.city,
              state: data.user.state,
              country: data.user.country,
              id: data.user.id,
              role: "user"
            },
            data.token
          );
          navigate("/profile");
        }
      } else {
        setError(data.message || "Invalid email or password");
      }
    } catch (err) {
      console.error(err);
      setError("Server error, please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Google login success
  const handleGoogleSuccess = (user) => {
    console.log('✅ Google login successful, redirecting...');
    
    // Navigate based on user role (Google users are typically regular users)
    if (user.role === "admin") {
      navigate("/admin/dashboard");
    } else {
      navigate("/profile");
    }
  };

  // Handle Google login error
  const handleGoogleError = (error) => {
    setError(error);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2 className="auth-title">Welcome Back</h2>
        <p className="subtitle">
          {selectedOption === "admin" ? "Admin Panel Access" : "Login to your account"}
        </p>

        {error && <div className="error-box">{error}</div>}

        {/* Google Login Section - Only show for user login */}
        {selectedOption === "user" && (
          <div className="google-login-section">
            <GoogleLoginButton 
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
            />
            
            <div className="divider">
              <span>or continue with email</span>
            </div>
          </div>
        )}

        <form onSubmit={handleLogin} className="auth-form">
          <div className="input-group">
            <FaUser className="icon" />
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <FaLock className="icon" />
            <input
              type="password"
              placeholder="Enter your Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <FaUser className="icon" />
            <select
              value={selectedOption}
              onChange={(e) => {
                setSelectedOption(e.target.value);
                setError(""); // Clear error when switching options
              }}
              required
              className="role-selector"
            >
              <option value="user">🛍️ Customer Login</option>
              <option value="admin">👑 Admin Access</option>
            </select>
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="footer-text">
          Don't have an account?{" "}
          <Link to="/signup" className="text-blue-600 hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Auth;

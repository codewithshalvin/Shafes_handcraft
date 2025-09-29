import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FaUser, FaLock } from "react-icons/fa";
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
          ? "http://localhost:5000/admin/login"
          : "http://localhost:5000/login";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role: selectedOption }),
      });

      const data = await res.json();

      if (res.ok) {
        if (selectedOption === "admin") {
          // For admin, store the token correctly
          login(
            { email: data.admin.email, name: data.admin.name, id: data.admin.id, role: "admin" },
            data.token
          );
          navigate("/admin/dashboard");
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

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2 className="auth-title">Welcome Back</h2>
        <p className="subtitle">Login to your account</p>

        {error && <div className="error-box">{error}</div>}

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
            <FaLock className="icon" />
            <select
              value={selectedOption}
              onChange={(e) => setSelectedOption(e.target.value)}
              required
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="footer-text">
          Don’t have an account?{" "}
          <Link to="/signup" className="text-blue-600 hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Auth;

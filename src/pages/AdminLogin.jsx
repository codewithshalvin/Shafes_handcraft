import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminLogin.css"; 

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      console.log('🔐 Admin login attempt:', { email });
      
      const response = await fetch('http://localhost:5000/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      console.log('🔍 Admin login response:', data);

      if (data.success && data.token) {
        // Store admin token and info
        localStorage.setItem("adminToken", data.token);
        localStorage.setItem("isAdmin", "true");
        localStorage.setItem("adminInfo", JSON.stringify(data.admin));
        
        console.log('✅ Admin login successful, redirecting...');
        navigate("/admin");
      } else {
        setError(data.message || "❌ Invalid admin credentials");
      }
    } catch (error) {
      console.error('❌ Admin login error:', error);
      setError("❌ Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <h2>Admin Login</h2>

      <form className="auth-form" onSubmit={handleSubmit}>
        {error && <p className="error">{error}</p>}

        <input
          type="email"
          placeholder="Admin Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Admin Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button type="submit" className="btn" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
}

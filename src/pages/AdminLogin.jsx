import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminLogin.css"; 

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();

    // 👉 Replace with backend call later
    if (email === "admin@shafe.com" && password === "admin123") {
      localStorage.setItem("isAdmin", "true"); // save login session
      navigate("/admin/dashboard"); // redirect to dashboard
    } else {
      setError("❌ Invalid admin credentials");
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

        <button type="submit" className="btn">Login</button>
      </form>
    </div>
  );
}

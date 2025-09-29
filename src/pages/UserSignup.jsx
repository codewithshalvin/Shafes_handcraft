import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./UserSignup.css";

export default function UserSignup() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    country: "",
  });

  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  // handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    // --- validations ---
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    if (formData.password.length < 6) {
      alert("Password must be at least 6 characters");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      alert("Invalid email format");
      return;
    }

    if (formData.phone && !/^\d{10}$/.test(formData.phone)) {
      alert("Phone must be 10 digits");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("http://localhost:5000/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      setLoading(false);

      if (res.ok && data.success) {
        // log in user immediately
        login({
          email: data.user.email,
          name: data.user.name,
          token: data.token,
        });
        navigate("/profile");
      } else {
        alert(data.message || "Signup failed");
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
      alert("Server error, please try again later");
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-card">
        <h2 className="signup-title">Create Account</h2>

        <form onSubmit={handleSubmit} className="signup-form">
          {/* Name */}
          <div className="form-field form-field-full">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              name="name"
              placeholder="Enter your name"
              value={formData.name}
              onChange={handleChange}
              required
              className="form-input"
            />
          </div>

          {/* Email */}
          <div className="form-field">
            <label className="form-label">Email</label>
            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              required
              className="form-input"
            />
          </div>

          {/* Phone */}
          <div className="form-field">
            <label className="form-label">Phone</label>
            <input
              type="tel"
              name="phone"
              placeholder="Enter 10-digit phone"
              value={formData.phone}
              onChange={handleChange}
              pattern="\d{10}"
              className="form-input"
            />
          </div>

          {/* Password */}
          <div className="form-field">
            <label className="form-label">Password</label>
            <input
              type="password"
              name="password"
              placeholder="Enter password"
              value={formData.password}
              onChange={handleChange}
              required
              className="form-input"
            />
          </div>

          {/* Confirm Password */}
          <div className="form-field">
            <label className="form-label">Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              className="form-input"
            />
          </div>

          {/* Address */}
          <div className="form-field form-field-full">
            <label className="form-label">Address</label>
            <input
              type="text"
              name="address"
              placeholder="Enter your address"
              value={formData.address}
              onChange={handleChange}
              className="form-input"
            />
          </div>

          {/* City */}
          <div className="form-field">
            <label className="form-label">City</label>
            <input
              type="text"
              name="city"
              placeholder="Enter your city"
              value={formData.city}
              onChange={handleChange}
              className="form-input"
            />
          </div>

          {/* State */}
          <div className="form-field">
            <label className="form-label">State</label>
            <input
              type="text"
              name="state"
              placeholder="Enter your state"
              value={formData.state}
              onChange={handleChange}
              className="form-input"
            />
          </div>

          {/* Country */}
          <div className="form-field form-field-full">
            <label className="form-label">Country</label>
            <input
              type="text"
              name="country"
              placeholder="Enter your country"
              value={formData.country}
              onChange={handleChange}
              className="form-input"
            />
          </div>

          {/* Submit */}
          <div className="form-field form-field-full">
            <button
              type="submit"
              className="submit-button"
              disabled={loading}
            >
              {loading ? "Signing Up..." : "Sign Up"}
            </button>
          </div>

          <p className="signin-link-container">
            Already have an account?{" "}
            <span
              onClick={() => navigate("/auth")}
              className="signin-link"
              role="button"
              tabIndex={0}
            >
              Sign In
            </span>
          </p>
        </form>
      </div>
    </div>
  );
}

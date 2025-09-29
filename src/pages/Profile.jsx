import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import "./Profile.css";

export default function Profile() {
  const { token, user, setUser, logout } = useAuth();
  const [formData, setFormData] = useState(user || {});
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (token) {
      fetch("http://localhost:5000/api/profile", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          setFormData(data);
          setUser(data);
        })
        .catch((err) => console.error("Failed to fetch profile:", err));
    }
  }, [token, setUser]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
        setEditing(false);
        alert("Profile updated successfully!");
      } else {
        alert(data.message || "Update failed");
      }
    } catch (err) {
      console.error(err);
      alert("Server error");
    }
  };

  if (!formData) return <p className="loading-text">Loading...</p>;

  return (
    <div className="profile-container">
      <div className="profile-card">
        <h2 className="profile-title">My Profile</h2>
        <p className="profile-subtitle">Manage your personal information</p>

        {["name", "email", "phone", "address", "city", "state", "country"].map((field) => (
          <div key={field} className="form-group">
            <label className="form-label">{field}</label>
            <input
              type="text"
              name={field}
              value={formData[field] || ""}
              disabled={!editing || field === "email"}
              onChange={handleChange}
              className="form-input"
              placeholder={`Enter your ${field}`}
            />
          </div>
        ))}

        {editing ? (
          <div className="button-group">
            <button onClick={handleSave} className="btn btn-primary">
              Save Changes
            </button>
            <button onClick={() => setEditing(false)} className="btn btn-secondary">
              Cancel
            </button>
          </div>
        ) : (
          <button onClick={() => setEditing(true)} className="btn btn-success">
            Edit Profile
          </button>
        )}

        <button onClick={logout} className="btn btn-danger">
          Logout
        </button>
      </div>
    </div>
  );
}

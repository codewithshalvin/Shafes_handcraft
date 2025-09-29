// src/pages/Admin/Dashboard.jsx
import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from "recharts";
import "./Dashboard.css"; // Import the CSS file

export default function Dashboard() {
  const [stats, setStats] = useState({
    orders: 0,
    users: 0,
    categories: 0,
    products: 0,
  });

  useEffect(() => {
    fetch("http://localhost:5000/api/admin/stats")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStats(data.stats);
        }
      })
      .catch((err) => console.error("Error loading dashboard stats:", err));
  }, []);

  const data = [
    { name: "Users", value: stats.users },
    { name: "Products", value: stats.products },
    { name: "Categories", value: stats.categories },
    { name: "Orders", value: stats.orders },
  ];

  return (
    <div className="dashboard-container">
      <h1 className="dashboard-title">📊 Admin Dashboard</h1>

      {/* Stats Cards */}
      <div className="stats-grid">
        {data.map((item, idx) => (
          <div key={idx} className="stat-card">
            <h2 className="stat-card-title">{item.name}</h2>
            <p className="stat-card-value">{item.value}</p>
          </div>
        ))}
      </div>

      {/* Chart Section */}
      <div className="chart-container">
        <h2 className="chart-title">Overview</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#3b82f6" radius={[10, 10, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
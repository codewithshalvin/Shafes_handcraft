import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Checkout.css";

export default function Checkout() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    address: "",
    phone: "",
    payment: "COD",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    localStorage.setItem("checkoutDetails", JSON.stringify(form));
    navigate("/payment");
  };

  return (
    <div className="checkout-container">
      <div className="checkout-card">
        <h2>Checkout</h2>
        <form onSubmit={handleSubmit} className="checkout-form">
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Full Name"
            required
          />
          <input
            name="address"
            value={form.address}
            onChange={handleChange}
            placeholder="Shipping Address"
            required
          />
          <input
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="Phone Number"
            required
          />
          <select
            name="payment"
            value={form.payment}
            onChange={handleChange}
          >
            <option value="COD">Cash on Delivery</option>
            <option value="UPI">UPI</option>
            <option value="Card">Card</option>
          </select>
          <button type="submit">Proceed to Payment</button>
        </form>
      </div>
    </div>
  );
}

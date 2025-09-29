// src/pages/OrderTracking.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function OrderTracking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    const savedOrder = localStorage.getItem("order");
    if (savedOrder) {
      const parsed = JSON.parse(savedOrder);
      if (!id || parsed.orderId === id) {
        setOrder(parsed);
      }
    }
  }, [id]);

  if (!order) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-bold">No order found</h2>
        <button
          onClick={() => navigate("/")}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded"
        >
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h2 className="text-2xl font-bold mb-4">Order Tracking</h2>
      <p className="mb-2">Order ID: {order.orderId}</p>
      <p className="mb-2">Name: {order.name}</p>
      <p className="mb-2">Address: {order.address}</p>
      <p className="mb-2">Phone: {order.phone}</p>
      <p className="mb-2">Payment Method: {order.payment}</p>
      <p className="mb-4 font-semibold text-green-600">
        Status: {order.status}
      </p>

      <div className="border-t mt-4 pt-4">
        <p>🚚 Your order is being processed and will be shipped soon.</p>
      </div>
    </div>
  );
}

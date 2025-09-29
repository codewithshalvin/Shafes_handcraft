// src/pages/Payment.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Payment() {
  const navigate = useNavigate();
  const [details, setDetails] = useState(null);
  const [status, setStatus] = useState("pending");

  useEffect(() => {
    const saved = localStorage.getItem("checkoutDetails");
    if (saved) {
      setDetails(JSON.parse(saved));
    }
  }, []);

  const handlePayment = () => {
    setStatus("processing");
    setTimeout(() => {
      const orderId = "ORD" + Date.now();
      localStorage.setItem(
        "order",
        JSON.stringify({ ...details, orderId, status: "Confirmed" })
      );
      setStatus("success");
      navigate(`/tracking/${orderId}`);
    }, 1500);
  };

  if (!details) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl">No checkout details found.</h2>
        <button
          onClick={() => navigate("/checkout")}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded"
        >
          Go to Checkout
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h2 className="text-2xl font-bold mb-4">Payment</h2>
      <p className="mb-2">Name: {details.name}</p>
      <p className="mb-2">Address: {details.address}</p>
      <p className="mb-2">Phone: {details.phone}</p>
      <p className="mb-4">Method: {details.payment}</p>

      {status === "pending" && (
        <button
          onClick={handlePayment}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          Confirm & Pay
        </button>
      )}

      {status === "processing" && <p>Processing payment...</p>}
      {status === "success" && <p className="text-green-600">Payment successful!</p>}
    </div>
  );
}

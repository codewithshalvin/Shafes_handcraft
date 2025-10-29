// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from "./App";
import "./index.css";
import { CartProvider } from "./context/CartContext";

const clientId = "671505013068-ca08tl63i3mq398tec0p1etlsd3gfq33.apps.googleusercontent.com";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={clientId}>
      <CartProvider>
        <App />
      </CartProvider>
    </GoogleOAuthProvider>
  </React.StrictMode>
);

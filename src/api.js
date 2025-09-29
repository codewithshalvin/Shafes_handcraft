import axios from "axios";

const API = axios.create({ baseURL: "http://localhost:5000" });

// 🔑 Attach admin token automatically
API.interceptors.request.use((req) => {
  const token = localStorage.getItem("adminToken"); // save token after login
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

// ================= PRODUCTS =================
export const fetchProducts = () => API.get("/products");
export const addProduct = (data) => API.post("/products", data);
export const updateProduct = (id, data) => API.put(`/products/${id}`, data);
export const deleteProduct = (id) => API.delete(`/products/${id}`);

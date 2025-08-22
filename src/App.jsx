import { Routes, Route } from "react-router-dom";
import Form from "./pages/Form";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import "./App.css";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Form />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
    </Routes>
  );
}

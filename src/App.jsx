import { Routes, Route } from "react-router-dom";
import QuizFlow from "./pages/QuizFlow";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import LeaderBoard from "./pages/Leaderboard";

import "./App.css";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<QuizFlow />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      <Route path="/result" element={<LeaderBoard />} />

    </Routes>
  );
}

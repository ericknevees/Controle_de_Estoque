import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Nav from "./components/Nav";
import ProtectedRoute from "./components/ProtectedRoute";

import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminProducts from "./pages/AdminProducts";
import AdminEntries from "./pages/AdminEntries";
import AdminReports from "./pages/AdminReports";
import UserExits from "./pages/UserExits";

export default function App() {
  return (
    <BrowserRouter>
      <Nav />
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/admin/produtos"
          element={
            <ProtectedRoute role="admin">
              <AdminProducts />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/entradas"
          element={
            <ProtectedRoute role="admin">
              <AdminEntries />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/relatorios"
          element={
            <ProtectedRoute role="admin">
              <AdminReports />
            </ProtectedRoute>
          }
        />

        <Route
          path="/usuario/saidas"
          element={
            <ProtectedRoute>
              <UserExits />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

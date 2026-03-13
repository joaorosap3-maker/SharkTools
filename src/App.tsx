import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Outlet } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Calendar from "./pages/Calendar";
import Inventory from "./pages/Inventory";
import Rentals from "./pages/Rentals";
import NewRental from "./pages/NewRental";
import Financial from "./pages/Financial";
import Fiscal from "./pages/Fiscal";
import Users from "./pages/Users";
import Reports from "./pages/Reports";
import Clients from "./pages/Clients";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import Cadastro from "./pages/Cadastro";
import PrivateRoute from "./components/PrivateRoute";
import { initializeData } from "./data/mockData";
import { AuthProvider } from "./components/AuthProvider";

export default function App() {
  useEffect(() => {
    initializeData();
  }, []);

  return (
    <AuthProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Cadastro />} />

          {/* Rotas Protegidas com Layout */}
          <Route
            element={
              <Layout>
                <Outlet />
              </Layout>
            }
          >
            <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/calendario" element={<PrivateRoute><Calendar /></PrivateRoute>} />
            <Route path="/inventario" element={<PrivateRoute><Inventory /></PrivateRoute>} />
            <Route path="/locacoes" element={<PrivateRoute><Rentals /></PrivateRoute>} />
            <Route path="/locacoes/nova" element={<PrivateRoute><NewRental /></PrivateRoute>} />
            <Route path="/locacoes/editar/:id" element={<PrivateRoute><NewRental /></PrivateRoute>} />
            <Route path="/financeiro" element={<PrivateRoute><Financial /></PrivateRoute>} />
            <Route path="/fiscal" element={<PrivateRoute><Fiscal /></PrivateRoute>} />
            
            {/* Rotas Administrativas */}
            <Route path="/usuarios" element={<PrivateRoute requiredRole="admin"><Users /></PrivateRoute>} />
            <Route path="/configuracoes" element={<PrivateRoute requiredRole="admin"><Settings /></PrivateRoute>} />
            
            <Route path="/relatorios" element={<PrivateRoute><Reports /></PrivateRoute>} />
            <Route path="/clientes" element={<PrivateRoute><Clients /></PrivateRoute>} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}
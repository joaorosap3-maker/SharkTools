import React from "react";
import { BrowserRouter as Router, Routes, Route, Outlet, Navigate } from "react-router-dom";

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
import Billing from "./pages/Billing";

import Login from "./pages/Login";
import Cadastro from "./pages/Cadastro";

import PrivateRoute from "./components/PrivateRoute";
import { AuthProvider } from "./components/AuthProvider";

export default function App() {

  return (
    <AuthProvider>
      <Router>

        <Routes>

          {/* Rotas públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Cadastro />} />

          {/* Rotas protegidas com layout */}
          <Route
            element={
              <PrivateRoute>
                <Layout>
                  <Outlet />
                </Layout>
              </PrivateRoute>
            }
          >

            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/calendario" element={<Calendar />} />
            <Route path="/inventario" element={<Inventory />} />
            <Route path="/locacoes" element={<Rentals />} />
            <Route path="/locacoes/nova" element={<NewRental />} />
            <Route path="/locacoes/editar/:id" element={<NewRental />} />
            <Route path="/financeiro" element={<Financial />} />
            <Route path="/fiscal" element={<Fiscal />} />

            {/* Rotas admin - com proteção extra de role */}
            <Route
              path="/usuarios"
              element={
                <PrivateRoute requiredRole="admin">
                  <Users />
                </PrivateRoute>
              }
            />

            <Route
              path="/configuracoes"
              element={
                <PrivateRoute requiredRole="admin">
                  <Settings />
                </PrivateRoute>
              }
            />

            <Route path="/relatorios" element={<Reports />} />
            <Route path="/clientes" element={<Clients />} />
            <Route path="/faturamento" element={<Billing />} />

          </Route>

        </Routes>

      </Router>
    </AuthProvider>
  );
}
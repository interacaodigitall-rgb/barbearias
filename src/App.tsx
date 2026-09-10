/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { authService } from './services/authService';

import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Services from './pages/Services';
import Barbers from './pages/Barbers';
import Booking from './pages/Booking';
import Appointments from './pages/Appointments';
import Loyalty from './pages/Loyalty';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import GerenteDashboard from './pages/GerenteDashboard';
import BarberDashboard from './pages/BarberDashboard';
import SaaSLanding from './pages/SaaSLanding';
import SuperAdminDashboard from './pages/SuperAdminDashboard';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuthStore();
  
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  }
  
  return user ? <>{children}</> : <Navigate to="/login" />;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuthStore();
  
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  }
  
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'customer') return <Navigate to="/appointments" replace />;
  if (user.role === 'barber') return <Navigate to="/barber-dashboard" replace />;
  
  return <>{children}</>;
}

function SuperAdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuthStore();
  
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  }
  
  return user && user.role === 'superadmin' ? <>{children}</> : <Navigate to="/login" />;
}

// App initialized with WebP image support
export default function App() {
  useEffect(() => {
    const unsubscribe = authService.initAuthListener();
    return () => unsubscribe();
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        <Route path="/" element={<Layout />}>
          {/* SaaS B2B Sales Landing Page at root / and /saas */}
          <Route index element={<SaaSLanding />} />
          <Route path="saas" element={<SaaSLanding />} />
          
          {/* Super Admin Dashboard for SaaS Owner */}
          <Route path="super-admin" element={
            <SuperAdminRoute>
              <SuperAdminDashboard />
            </SuperAdminRoute>
          } />

          {/* Standard direct routes */}
          <Route path="services" element={<Services />} />
          <Route path="barbers" element={<Barbers />} />
          <Route path="booking" element={<Booking />} />
          <Route path="loyalty" element={<Loyalty />} />

          {/* Protected Routes */}
          <Route path="appointments" element={
            <PrivateRoute>
              <Appointments />
            </PrivateRoute>
          } />
          <Route path="profile" element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          } />
          <Route path="admin" element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          } />
          <Route path="gerente" element={
            <AdminRoute>
              <GerenteDashboard />
            </AdminRoute>
          } />
          <Route path="barber-dashboard" element={
            <PrivateRoute>
              <BarberDashboard />
            </PrivateRoute>
          } />

          {/* Dynamic B2C Tenant Route: /:slug (e.g. /mister-navalha, /seu-elias, /sherlocks) */}
          <Route path=":slug" element={<Home />} />
          <Route path=":slug/booking" element={<Booking />} />
          <Route path=":slug/services" element={<Services />} />
          <Route path=":slug/barbers" element={<Barbers />} />
          <Route path=":slug/appointments" element={<Appointments />} />
          <Route path=":slug/loyalty" element={<Loyalty />} />
          <Route path=":slug/gerente" element={
            <AdminRoute>
              <GerenteDashboard />
            </AdminRoute>
          } />
        </Route>
      </Routes>
    </Router>
  );
}

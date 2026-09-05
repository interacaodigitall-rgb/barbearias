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
import BarberDashboard from './pages/BarberDashboard';
import SaaSLanding from './pages/SaaSLanding';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuthStore();
  
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  }
  
  return user ? <>{children}</> : <Navigate to="/login" />;
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
          <Route index element={<Home />} />
          <Route path="services" element={<Services />} />
          <Route path="barbers" element={<Barbers />} />
          <Route path="booking" element={<Booking />} />
          <Route path="saas" element={<SaaSLanding />} />
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
            <PrivateRoute>
              <AdminDashboard />
            </PrivateRoute>
          } />
          <Route path="barber-dashboard" element={
            <PrivateRoute>
              <BarberDashboard />
            </PrivateRoute>
          } />
        </Route>
      </Routes>
    </Router>
  );
}

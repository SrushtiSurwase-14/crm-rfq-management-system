import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Leads from './pages/Leads';
import Products from './pages/Products';
import RFQs from './pages/RFQs';
import RFQDetail from './pages/RFQDetail';
import Quotes from './pages/Quotes';
import QuoteDetail from './pages/QuoteDetail';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Navbar />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/customers" element={<ProtectedRoute><Customers /></ProtectedRoute>} />
          <Route path="/leads" element={<ProtectedRoute><Leads /></ProtectedRoute>} />
          <Route path="/products" element={<ProtectedRoute><Products /></ProtectedRoute>} />
          <Route path="/rfqs" element={<ProtectedRoute><RFQs /></ProtectedRoute>} />
          <Route path="/rfqs/:id" element={<ProtectedRoute><RFQDetail /></ProtectedRoute>} />
          <Route path="/quotes" element={<ProtectedRoute><Quotes /></ProtectedRoute>} />
          <Route path="/quotes/:id" element={<ProtectedRoute><QuoteDetail /></ProtectedRoute>} />
        </Routes>
        <SpeedInsights />
      </AuthProvider>
    </BrowserRouter>
  );
}

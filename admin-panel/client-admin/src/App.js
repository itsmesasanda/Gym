import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AdminAuthProvider } from './context/AdminAuthContext';
import { UserAuthProvider } from './context/UserAuthContext';
import ProtectedAdminRoute   from './components/ProtectedAdminRoute';
import ProtectedUserRoute    from './components/ProtectedUserRoute';
import AdminNavbar           from './components/AdminNavbar';
import Sidebar               from './components/Sidebar';

import AdminLogin     from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import ManageUsers    from './pages/ManageUsers';
import ManageMeals         from './pages/ManageMeals';
import ManageAnnouncements from './pages/ManageAnnouncements';
import ManageEvents        from './pages/ManageEvents';
import ManageVideos        from './pages/ManageVideos';
import ManagePayments      from './pages/ManagePayments';
import ManageAdmins        from './pages/ManageAdmins';
import Reports             from './pages/Reports';
import UserLogin           from './pages/UserLogin';
import UserHome            from './pages/UserHome';

const Layout = ({ children }) => (
  <div className="admin-shell">
    <AdminNavbar />
    <div className="admin-body">
      <Sidebar />
      <main className="admin-main">{children}</main>
    </div>
  </div>
);

const App = () => (
  <AdminAuthProvider>
    <UserAuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<AdminLogin />} />
          <Route path="/user/login" element={<UserLogin />} />
          <Route
            path="/user"
            element={
              <ProtectedUserRoute>
                <UserHome />
              </ProtectedUserRoute>
            }
          />
          <Route
            path="/"
            element={
              <ProtectedAdminRoute>
                <Layout><AdminDashboard /></Layout>
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/users"
            element={
              <ProtectedAdminRoute>
                <Layout><ManageUsers /></Layout>
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/meals"
            element={
              <ProtectedAdminRoute>
                <Layout><ManageMeals /></Layout>
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/announcements"
            element={
              <ProtectedAdminRoute>
                <Layout><ManageAnnouncements /></Layout>
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/events"
            element={
              <ProtectedAdminRoute>
                <Layout><ManageEvents /></Layout>
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/videos"
            element={
              <ProtectedAdminRoute>
                <Layout><ManageVideos /></Layout>
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/payments"
            element={
              <ProtectedAdminRoute>
                <Layout><ManagePayments /></Layout>
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedAdminRoute>
                <Layout><Reports /></Layout>
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/admins"
            element={
              <ProtectedAdminRoute>
                <Layout><ManageAdmins /></Layout>
              </ProtectedAdminRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </UserAuthProvider>
  </AdminAuthProvider>
);

export default App;

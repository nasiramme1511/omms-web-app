import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import LegacyDashboardRedirect from './components/LegacyDashboardRedirect';

import SuperAdminLayout from './components/layouts/SuperAdminLayout';
import OrgAdminLayout from './components/layouts/OrgAdminLayout';
import MemberLayout from './components/layouts/MemberLayout';

import SuperAdminDashboard from './pages/super-admin/SuperAdminDashboard';
import SuperAdminOrgAdmins from './pages/super-admin/SuperAdminOrgAdmins';
import SuperAdminAddAdmin from './pages/super-admin/SuperAdminAddAdmin';
import SuperAdminMembers from './pages/super-admin/SuperAdminMembers';
import SuperAdminPayments from './pages/super-admin/SuperAdminPayments';
import PlanManagement from './pages/super-admin/PlanManagement';
// System configuration
import SystemConfig from './pages/super-admin/SystemConfig';

import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Members from './pages/Members';
import Events from './pages/Events';
import Blogs from './pages/Blogs';
import Payments from './pages/Payments';
import Profile from './pages/Profile';
import AdminOrganizations from './pages/AdminOrganizations';
import UpgradePlan from './pages/org/UpgradePlan';
import OrgSettings from './pages/org/OrgSettings';

import MemberOverview from './pages/member/MemberOverview';
import MemberEvents from './pages/member/MemberEvents';
import MemberBlog from './pages/member/MemberBlog';
import MemberPayments from './pages/member/MemberPayments';

import Home from './pages/Home';
import About from './pages/About';
import Services from './pages/Services';
import Contact from './pages/Contact';
import PublicEvents from './pages/PublicEvents';
import PublicBlogs from './pages/PublicBlogs';
import { OrgLegacyRedirect, OrganAdminLegacyRedirect } from './components/OrgPathRedirects';

const queryClient = new QueryClient();

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/services" element={<Services />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/events" element={<PublicEvents />} />
            <Route path="/blogs" element={<PublicBlogs />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            <Route
              path="/dashboard/*"
              element={
                <PrivateRoute>
                  <LegacyDashboardRedirect />
                </PrivateRoute>
              }
            />

            <Route
              path="/super-admin"
              element={
                <PrivateRoute roles={['SuperAdmin']}>
                  <SuperAdminLayout />
                </PrivateRoute>
              }
            >
              <Route index element={<SuperAdminDashboard />} />
              <Route path="organizations" element={<AdminOrganizations />} />
              <Route path="org-admins" element={<SuperAdminOrgAdmins />} />
              <Route path="add-admin" element={<SuperAdminAddAdmin />} />
              <Route path="members" element={<SuperAdminMembers />} />
              <Route path="plans" element={<PlanManagement />} />
              <Route path="payments" element={<SuperAdminPayments />} />
              <Route path="system-config" element={<SystemConfig />} />
              <Route path="profile" element={<Profile />} />
            </Route>

            <Route path="/organadmin/*" element={<OrganAdminLegacyRedirect />} />

            <Route
              path="/org-admin"
              element={
                <PrivateRoute roles={['orgAdmin']}>
                  <OrgAdminLayout />
                </PrivateRoute>
              }
            >
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="members" element={<Members />} />
              <Route path="events" element={<Events />} />
              <Route path="blogs" element={<Blogs />} />
              <Route path="payments" element={<Payments />} />
              <Route path="profile" element={<Profile />} />
              <Route path="upgrade" element={<UpgradePlan />} />
              <Route path="settings" element={<OrgSettings />} />
            </Route>

            <Route path="/org/*" element={<OrgLegacyRedirect />} />

            <Route
              path="/member"
              element={
                <PrivateRoute roles={['member']}>
                  <MemberLayout />
                </PrivateRoute>
              }
            >
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<MemberOverview />} />
              <Route path="profile" element={<Profile />} />
              <Route path="events" element={<MemberEvents />} />
              <Route path="blog" element={<MemberBlog />} />
              <Route path="payments" element={<MemberPayments />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;

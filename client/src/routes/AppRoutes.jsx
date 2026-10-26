import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "../pages/LandingPage";
import LoginPage from "../pages/LoginPage";
import SignupPage from "../pages/SignupPage";
import AcceptInvitationPage from "../pages/AcceptInvitationPage";
import ForgotPasswordPage from "../pages/ForgotPasswordPage";
import ResetPasswordPage from "../pages/ResetPasswordPage";
import OrganizationLayout from "../components/organization/OrganizationLayout";
import OrganizationDashboard from "../pages/organization/OrganizationDashboard";
import EmployeesPage from "../pages/organization/EmployeesPage";
import InvitationsPage from "../pages/organization/InvitationsPage";
import OrganizationSettingsPage from "../pages/organization/OrganizationSettingsPage";
import OrganizationProfilePage from "../pages/organization/OrganizationProfilePage";
import AuditLogsPage from "../pages/organization/AuditLogsPage";
import WebhooksPage from "../pages/organization/WebhooksPage";
import CustomFieldsPage from "../pages/organization/CustomFieldsPage";
import ProtectedRoute from "../components/ProtectedRoute";
import EmployeeLayout from "../components/employee/EmployeeLayout";
import DashboardHome from "../pages/employee/DashboardHome";
import Leads from "../pages/employee/Leads";
import ConstructionLeads from "../pages/employee/ConstructionLeads";
import RedevelopmentLeads from "../pages/employee/RedevelopmentLeads";
import MaintenanceLeads from "../pages/employee/MaintenanceLeads";
import Customers from "../pages/employee/Customers";
import Tasks from "../pages/employee/Tasks";
import Activities from "../pages/employee/Activities";
import Notes from "../pages/employee/Notes";
import Notifications from "../pages/employee/Notifications";
import Profile from "../pages/employee/Profile";
import Calendar from "../pages/employee/Calendar";
import Analytics from "../pages/employee/Analytics";
import Products from "../pages/employee/Products";
import OwnersDetail from "../pages/employee/OwnersDetail";
import Subcontractors from "../pages/employee/Subcontractors";
import MaterialSuppliers from "../pages/employee/MaterialSuppliers";
import ConstructionCustomers from "../pages/employee/ConstructionCustomers";

import SuperAdminLogin from "../pages/SuperAdminLogin";
import SuperAdminLayout from "../components/super-admin/SuperAdminLayout";
import SuperAdminDashboard from "../pages/super-admin/SuperAdminDashboard";

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/accept-invitation/:token" element={<AcceptInvitationPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

        {/* Super Admin Routes */}
        <Route path="/super-admin/login" element={<SuperAdminLogin />} />
        <Route
          path="/super-admin"
          element={
            <ProtectedRoute allowedRoles={["SUPER_ADMIN"]}>
              <SuperAdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<SuperAdminDashboard />} />
        </Route>

        {/* Organization Admin routes (with CRM tabs for Real Estate and Construction Org Admins) */}
        <Route
          path="/organization"
          element={
            <ProtectedRoute allowedRoles={["ORG_ADMIN"]}>
              <OrganizationLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<OrganizationDashboard />} />
          <Route path="employees" element={<EmployeesPage />} />
          <Route path="invitations" element={<InvitationsPage />} />
          <Route path="settings" element={<OrganizationSettingsPage />} />
          <Route path="profile" element={<OrganizationProfilePage />} />
          <Route path="audit-logs" element={<AuditLogsPage />} />
          <Route path="webhooks" element={<WebhooksPage />} />
          <Route path="custom-fields" element={<CustomFieldsPage />} />

          {/* Real Estate Org Admin CRM tabs */}
          <Route path="leads" element={<Leads />} />
          <Route path="products" element={<Products />} />
          <Route path="ventures" element={<Products />} />
          <Route path="owners-detail" element={<OwnersDetail />} />
          <Route path="customers" element={<Customers />} />

          {/* Construction Org Admin CRM tabs */}
          <Route path="construction-leads" element={<ConstructionLeads />} />
          <Route path="redevelopment-leads" element={<RedevelopmentLeads />} />
          <Route path="maintenance-leads" element={<MaintenanceLeads />} />
          <Route path="construction-customers" element={<ConstructionCustomers />} />
          <Route path="subcontractors" element={<Subcontractors />} />
          <Route path="material-suppliers" element={<MaterialSuppliers />} />

          {/* Common Shared Org Admin CRM tabs */}
          <Route path="tasks" element={<Tasks />} />
          <Route path="calendar" element={<Calendar />} />
          <Route path="notes" element={<Notes />} />
          <Route path="analytics" element={<Analytics />} />
        </Route>

        {/* Employee routes (Sales Executives) */}
        <Route
          path="/employee"
          element={
            <ProtectedRoute allowedRoles={["EMPLOYEE"]}>
              <EmployeeLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardHome />} />
          {/* Real Estate Tabs */}
          <Route path="leads" element={<Leads />} />
          <Route path="products" element={<Products />} />
          <Route path="ventures" element={<Products />} />
          <Route path="owners-detail" element={<OwnersDetail />} />
          <Route path="customers" element={<Customers />} />

          {/* Construction Tabs */}
          <Route path="construction-leads" element={<ConstructionLeads />} />
          <Route path="redevelopment-leads" element={<RedevelopmentLeads />} />
          <Route path="maintenance-leads" element={<MaintenanceLeads />} />
          <Route path="construction-customers" element={<ConstructionCustomers />} />
          <Route path="subcontractors" element={<Subcontractors />} />
          <Route path="material-suppliers" element={<MaterialSuppliers />} />

          {/* Common Shared Tabs */}
          <Route path="tasks" element={<Tasks />} />
          <Route path="activities" element={<Activities />} />
          <Route path="calendar" element={<Calendar />} />
          <Route path="notes" element={<Notes />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;
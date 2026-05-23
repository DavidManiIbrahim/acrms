import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import ServiceRequest from "./pages/ServiceRequest";
import TechnicianDashboard from "./pages/TechnicianDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import MyRequests from "./pages/MyRequests";
import MyAssets from "./pages/MyAssets";
import Notifications from "./pages/Notifications";
import ActivityPage from "./pages/ActivityPage";
import JobRequests from "./pages/JobRequests";
import UserManagement from "./pages/UserManagement";
import Contacts from "./pages/Contacts";
import SalesPipeline from "./pages/SalesPipeline";
import StaffManagement from "./pages/StaffManagement";
import Products from "./pages/Products";
import Reports from "./pages/Reports";
import EmailCampaigns from "./pages/EmailCampaigns";
import NotFound from "./pages/NotFound";
import Inventory from "./pages/Inventory";
import Calendar from "./pages/Calendar";
import ExecutiveDashboard from "./pages/ExecutiveDashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<ProtectedRoute requireAuth={false}><Auth /></ProtectedRoute>} />
          
          {/* Protected Dashboard */}
          <Route path="/dashboard" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/user-dashboard" element={
            <ProtectedRoute allowedRoles={['user', 'technician', 'sales']}>
              <Dashboard />
            </ProtectedRoute>
          } />
          
          {/* CRM Routes - Sales team access */}
          <Route path="/contacts" element={
            <ProtectedRoute allowedRoles={['admin', 'sales', 'manager', 'ceo']}>
              <Contacts />
            </ProtectedRoute>
          } />
          <Route path="/staff-management" element={
            <ProtectedRoute allowedRoles={['admin', 'ceo', 'manager']}>
              <StaffManagement />
            </ProtectedRoute>
          } />
          <Route path="/sales-pipeline" element={
            <ProtectedRoute allowedRoles={['admin', 'sales', 'manager', 'ceo']}>
              <SalesPipeline />
            </ProtectedRoute>
          } />
          <Route path="/products" element={
            <ProtectedRoute allowedRoles={['admin', 'sales', 'manager', 'ceo']}>
              <Products />
            </ProtectedRoute>
          } />
          <Route path="/reports" element={
            <ProtectedRoute allowedRoles={['admin', 'sales', 'manager', 'ceo']}>
              <Reports />
            </ProtectedRoute>
          } />
          <Route path="/email-campaigns" element={
            <ProtectedRoute allowedRoles={['admin', 'sales', 'manager', 'ceo']}>
              <EmailCampaigns />
            </ProtectedRoute>
          } />
          
          {/* Service Management Routes */}
          <Route path="/service-request" element={
            <ProtectedRoute allowedRoles={['user', 'admin', 'sales', 'manager', 'ceo']}>
              <ServiceRequest />
            </ProtectedRoute>
          } />
          <Route path="/technician-dashboard" element={
            <ProtectedRoute allowedRoles={['technician', 'admin']}>
              <TechnicianDashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin-dashboard" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/my-requests" element={
            <ProtectedRoute allowedRoles={['user', 'admin']}>
              <MyRequests />
            </ProtectedRoute>
          } />
          <Route path="/my-assets" element={
            <ProtectedRoute>
              <MyAssets />
            </ProtectedRoute>
          } />
          <Route path="/inventory" element={
            <ProtectedRoute allowedRoles={['admin', 'technician', 'sales', 'manager', 'ceo']}>
              <Inventory />
            </ProtectedRoute>
          } />
          <Route path="/notifications" element={
            <ProtectedRoute>
              <Notifications />
            </ProtectedRoute>
          } />
          <Route path="/activity" element={
            <ProtectedRoute>
              <ActivityPage />
            </ProtectedRoute>
          } />
          <Route path="/job-requests" element={
            <ProtectedRoute allowedRoles={['technician', 'admin']}>
              <JobRequests />
            </ProtectedRoute>
          } />
          <Route path="/user-management" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <UserManagement />
            </ProtectedRoute>
          } />
          <Route path="/calendar" element={
            <ProtectedRoute allowedRoles={['technician', 'admin', 'sales', 'manager', 'ceo']}>
              <Calendar />
            </ProtectedRoute>
          } />
          
          {/* Executive Dashboard Route */}
          <Route path="/executive-dashboard" element={
            <ProtectedRoute allowedRoles={['ceo', 'manager']}>
              <ExecutiveDashboard />
            </ProtectedRoute>
          } />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

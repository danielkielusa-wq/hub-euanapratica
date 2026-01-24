import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import StudentDashboard from "./pages/dashboards/StudentDashboard";
import StudentAgenda from "./pages/dashboards/StudentAgenda";
import MentorDashboard from "./pages/dashboards/MentorDashboard";
import MentorAgenda from "./pages/mentor/MentorAgenda";
import CreateSession from "./pages/mentor/CreateSession";
import EditSession from "./pages/mentor/EditSession";
import SessionAttendance from "./pages/mentor/SessionAttendance";
import AdminDashboard from "./pages/dashboards/AdminDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Protected route component
function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
  const { isAuthenticated, user } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // Redirect to appropriate dashboard based on role
    const routes = {
      student: '/dashboard',
      mentor: '/mentor/dashboard',
      admin: '/admin/dashboard',
    };
    return <Navigate to={routes[user.role]} replace />;
  }
  
  return <>{children}</>;
}

// Public route - redirect to dashboard if already authenticated
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  
  if (isAuthenticated && user) {
    const routes = {
      student: '/dashboard',
      mentor: '/mentor/dashboard',
      admin: '/admin/dashboard',
    };
    return <Navigate to={routes[user.role]} replace />;
  }
  
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Index />} />
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/cadastro" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/esqueci-senha" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
      
      {/* Student routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute allowedRoles={['student']}>
          <StudentDashboard />
        </ProtectedRoute>
      } />
      <Route path="/dashboard/agenda" element={
        <ProtectedRoute allowedRoles={['student']}>
          <StudentAgenda />
        </ProtectedRoute>
      } />
      
      {/* Mentor routes */}
      <Route path="/mentor/dashboard" element={
        <ProtectedRoute allowedRoles={['mentor']}>
          <MentorDashboard />
        </ProtectedRoute>
      } />
      <Route path="/mentor/agenda" element={
        <ProtectedRoute allowedRoles={['mentor']}>
          <MentorAgenda />
        </ProtectedRoute>
      } />
      <Route path="/mentor/sessao/nova" element={
        <ProtectedRoute allowedRoles={['mentor']}>
          <CreateSession />
        </ProtectedRoute>
      } />
      <Route path="/mentor/sessao/:id" element={
        <ProtectedRoute allowedRoles={['mentor']}>
          <EditSession />
        </ProtectedRoute>
      } />
      <Route path="/mentor/sessao/:id/presenca" element={
        <ProtectedRoute allowedRoles={['mentor']}>
          <SessionAttendance />
        </ProtectedRoute>
      } />
      
      {/* Admin routes */}
      <Route path="/admin/dashboard" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminDashboard />
        </ProtectedRoute>
      } />
      
      {/* Catch-all */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

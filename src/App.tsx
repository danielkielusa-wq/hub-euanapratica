import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import StudentDashboard from "./pages/dashboards/StudentDashboard";
import StudentAgenda from "./pages/dashboards/StudentAgenda";
import StudentEspacos from "./pages/student/StudentEspacos";
import StudentEspacoDetail from "./pages/student/StudentEspacoDetail";
import StudentSuporte from "./pages/student/StudentSuporte";
import StudentAssignments from "./pages/assignments/StudentAssignments";
import AssignmentDetailPage from "./pages/assignments/AssignmentDetailPage";
import ProfilePage from "./pages/account/ProfilePage";
import MentorDashboard from "./pages/dashboards/MentorDashboard";
import MentorAgenda from "./pages/mentor/MentorAgenda";
import MentorEspacos from "./pages/mentor/MentorEspacos";
import MentorEspacoDetail from "./pages/mentor/MentorEspacoDetail";
import MentorCreateEspaco from "./pages/mentor/MentorCreateEspaco";
import MentorAssignments from "./pages/mentor/MentorAssignments";
import CreateAssignment from "./pages/mentor/CreateAssignment";
import EditAssignment from "./pages/mentor/EditAssignment";
import ReviewSubmissions from "./pages/mentor/ReviewSubmissions";
import CreateSession from "./pages/mentor/CreateSession";
import EditSession from "./pages/mentor/EditSession";
import SessionAttendance from "./pages/mentor/SessionAttendance";
import AdminDashboard from "./pages/dashboards/AdminDashboard";
import AdminEspacos from "./pages/admin/AdminEspacos";
import AdminEspacoDetail from "./pages/admin/AdminEspacoDetail";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminEnrollments from "./pages/admin/AdminEnrollments";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminReports from "./pages/admin/AdminReports";
import AdminFeedback from "./pages/admin/AdminFeedback";
import StudentLibrary from "./pages/library/StudentLibrary";
import UploadMaterials from "./pages/admin/UploadMaterials";
import AdminE2ETests from "./pages/admin/AdminE2ETests";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminSubscriptions from "./pages/admin/AdminSubscriptions";
import AdminPlans from "./pages/admin/AdminPlans";
import CurriculoUSA from "./pages/curriculo/CurriculoUSA";
import CurriculoReport from "./pages/curriculo/CurriculoReport";
import Onboarding from "./pages/Onboarding";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Protected route component
function ProtectedRoute({ children, allowedRoles, skipOnboardingCheck }: { children: React.ReactNode; allowedRoles?: string[]; skipOnboardingCheck?: boolean }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = window.location.pathname;
  
  // Wait for auth state to be resolved before redirecting
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // Check if user needs to complete onboarding (skip for onboarding route itself)
  if (!skipOnboardingCheck && user && !user.has_completed_onboarding && location !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }
  
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // Redirect to appropriate dashboard based on role
    const routes: Record<string, string> = {
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
  const { isAuthenticated, isLoading, user } = useAuth();
  
  // Wait for auth state to be resolved before redirecting
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (isAuthenticated && user) {
    const routes: Record<string, string> = {
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
      <Route path="/reset-password" element={<ResetPassword />} />
      
      {/* Onboarding route */}
      <Route path="/onboarding" element={
        <ProtectedRoute skipOnboardingCheck>
          <Onboarding />
        </ProtectedRoute>
      } />
      
      {/* Student routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute allowedRoles={['student']}>
          <StudentDashboard />
        </ProtectedRoute>
      } />
      <Route path="/dashboard/espacos" element={
        <ProtectedRoute allowedRoles={['student']}>
          <StudentEspacos />
        </ProtectedRoute>
      } />
      <Route path="/dashboard/espacos/:id" element={
        <ProtectedRoute allowedRoles={['student']}>
          <StudentEspacoDetail />
        </ProtectedRoute>
      } />
      <Route path="/dashboard/agenda" element={
        <ProtectedRoute allowedRoles={['student']}>
          <StudentAgenda />
        </ProtectedRoute>
      } />
      <Route path="/dashboard/conteudo" element={
        <ProtectedRoute allowedRoles={['student']}>
          <Navigate to="/biblioteca" replace />
        </ProtectedRoute>
      } />
      <Route path="/dashboard/tarefas" element={
        <ProtectedRoute allowedRoles={['student']}>
          <StudentAssignments />
        </ProtectedRoute>
      } />
      <Route path="/dashboard/tarefas/:id" element={
        <ProtectedRoute allowedRoles={['student']}>
          <AssignmentDetailPage />
        </ProtectedRoute>
      } />
      <Route path="/dashboard/suporte" element={
        <ProtectedRoute allowedRoles={['student']}>
          <StudentSuporte />
        </ProtectedRoute>
      } />
      
      {/* Profile route - accessible by all authenticated users */}
      <Route path="/perfil" element={
        <ProtectedRoute allowedRoles={['student', 'mentor', 'admin']}>
          <ProfilePage />
        </ProtectedRoute>
      } />
      
      {/* Library routes - accessible by all authenticated users */}
      <Route path="/biblioteca" element={
        <ProtectedRoute allowedRoles={['student', 'mentor', 'admin']}>
          <StudentLibrary />
        </ProtectedRoute>
      } />
      <Route path="/biblioteca/pasta/:folderId" element={
        <ProtectedRoute allowedRoles={['student', 'mentor', 'admin']}>
          <StudentLibrary />
        </ProtectedRoute>
      } />
      
      {/* Mentor routes */}
      <Route path="/mentor/dashboard" element={
        <ProtectedRoute allowedRoles={['mentor', 'admin']}>
          <MentorDashboard />
        </ProtectedRoute>
      } />
      <Route path="/mentor/espacos" element={
        <ProtectedRoute allowedRoles={['mentor', 'admin']}>
          <MentorEspacos />
        </ProtectedRoute>
      } />
      <Route path="/mentor/espacos/novo" element={
        <ProtectedRoute allowedRoles={['mentor', 'admin']}>
          <MentorCreateEspaco />
        </ProtectedRoute>
      } />
      <Route path="/mentor/espacos/:id" element={
        <ProtectedRoute allowedRoles={['mentor', 'admin']}>
          <MentorEspacoDetail />
        </ProtectedRoute>
      } />
      <Route path="/mentor/agenda" element={
        <ProtectedRoute allowedRoles={['mentor', 'admin']}>
          <MentorAgenda />
        </ProtectedRoute>
      } />
      <Route path="/mentor/sessao/nova" element={
        <ProtectedRoute allowedRoles={['mentor', 'admin']}>
          <CreateSession />
        </ProtectedRoute>
      } />
      <Route path="/mentor/sessao/:id" element={
        <ProtectedRoute allowedRoles={['mentor', 'admin']}>
          <EditSession />
        </ProtectedRoute>
      } />
      <Route path="/mentor/sessao/:id/presenca" element={
        <ProtectedRoute allowedRoles={['mentor', 'admin']}>
          <SessionAttendance />
        </ProtectedRoute>
      } />
      <Route path="/mentor/tarefas" element={
        <ProtectedRoute allowedRoles={['mentor', 'admin']}>
          <MentorAssignments />
        </ProtectedRoute>
      } />
      <Route path="/mentor/tarefas/nova" element={
        <ProtectedRoute allowedRoles={['mentor', 'admin']}>
          <CreateAssignment />
        </ProtectedRoute>
      } />
      <Route path="/mentor/tarefas/:id" element={
        <ProtectedRoute allowedRoles={['mentor', 'admin']}>
          <EditAssignment />
        </ProtectedRoute>
      } />
      <Route path="/mentor/tarefas/:id/entregas" element={
        <ProtectedRoute allowedRoles={['mentor', 'admin']}>
          <ReviewSubmissions />
        </ProtectedRoute>
      } />
      
      {/* Admin routes */}
      <Route path="/admin/dashboard" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminDashboard />
        </ProtectedRoute>
      } />
      <Route path="/admin/espacos" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminEspacos />
        </ProtectedRoute>
      } />
      <Route path="/admin/espacos/:id" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminEspacoDetail />
        </ProtectedRoute>
      } />
      <Route path="/admin/usuarios" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminUsers />
        </ProtectedRoute>
      } />
      <Route path="/admin/matriculas" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminEnrollments />
        </ProtectedRoute>
      } />
      <Route path="/admin/produtos" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminProducts />
        </ProtectedRoute>
      } />
      <Route path="/admin/relatorios" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminReports />
        </ProtectedRoute>
      } />
      <Route path="/admin/biblioteca/upload" element={
        <ProtectedRoute allowedRoles={['admin', 'mentor']}>
          <UploadMaterials />
        </ProtectedRoute>
      } />
      <Route path="/admin/testes-e2e" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminE2ETests />
        </ProtectedRoute>
      } />
      <Route path="/admin/feedback" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminFeedback />
        </ProtectedRoute>
      } />
      <Route path="/admin/configuracoes" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminSettings />
        </ProtectedRoute>
      } />
      <Route path="/admin/assinaturas" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminSubscriptions />
        </ProtectedRoute>
      } />
      <Route path="/admin/planos" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminPlans />
        </ProtectedRoute>
      } />
      
      {/* Currículo USA - accessible by students, mentors, and admins */}
      <Route path="/curriculo" element={
        <ProtectedRoute allowedRoles={['student', 'mentor', 'admin']}>
          <CurriculoUSA />
        </ProtectedRoute>
      } />
      <Route path="/curriculo/resultado" element={
        <ProtectedRoute allowedRoles={['student', 'mentor', 'admin']}>
          <CurriculoReport />
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

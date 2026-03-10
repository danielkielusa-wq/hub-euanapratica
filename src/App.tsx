import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
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
import MentorEditEspaco from "./pages/mentor/MentorEditEspaco";
import MentorAssignments from "./pages/mentor/MentorAssignments";
import CreateAssignment from "./pages/mentor/CreateAssignment";
import EditAssignment from "./pages/mentor/EditAssignment";
import ReviewSubmissions from "./pages/mentor/ReviewSubmissions";
import CreateSession from "./pages/mentor/CreateSession";
import EditSession from "./pages/mentor/EditSession";
import SessionAttendance from "./pages/mentor/SessionAttendance";
import AdminDashboard from "./pages/dashboards/AdminDashboard";
const AdminEspacos = lazy(() => import("./pages/admin/AdminEspacos"));
const AdminEspacoDetail = lazy(() => import("./pages/admin/AdminEspacoDetail"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminEnrollments = lazy(() => import("./pages/admin/AdminEnrollments"));
const AdminHubServices = lazy(() => import("./pages/admin/AdminHubServices"));
const AdminReports = lazy(() => import("./pages/admin/AdminReports"));
const AdminFeedback = lazy(() => import("./pages/admin/AdminFeedback"));
const AdminWaitlist = lazy(() => import("./pages/admin/AdminWaitlist"));
import StudentLibrary from "./pages/library/StudentLibrary";
const AdminGlobalLibrary = lazy(() => import("./pages/admin/AdminGlobalLibrary"));
import GlobalLibrary from "./pages/library/GlobalLibrary";
const AdminE2ETests = lazy(() => import("./pages/admin/AdminE2ETests"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const AdminApis = lazy(() => import("./pages/admin/AdminApis"));
const AdminEmailTemplates = lazy(() => import("./pages/admin/AdminEmailTemplates"));
const AdminEmailCampaigns = lazy(() => import("./pages/admin/AdminEmailCampaigns"));
const AdminSubscriptions = lazy(() => import("./pages/admin/AdminSubscriptions"));
const AdminAuditLogs = lazy(() => import("./pages/admin/AdminAuditLogs"));
const AdminPlans = lazy(() => import("./pages/admin/AdminPlans"));
const AdminTictoSimulator = lazy(() => import("./pages/admin/AdminTictoSimulator"));
const CurriculoUSA = lazy(() => import("./pages/curriculo/CurriculoUSA"));
const CurriculoReport = lazy(() => import("./pages/curriculo/CurriculoReport"));
const SavedReportPage = lazy(() => import("./pages/curriculo/SavedReportPage"));
import Onboarding from "./pages/Onboarding";
import StudentHub from "./pages/hub/StudentHub";
import StudentHubGlass from "./pages/hub/StudentHubGlass";
import ServiceCatalog from "./pages/hub/ServiceCatalog";
import PaymentSuccess from "./pages/PaymentSuccess";
import MyOrders from "./pages/orders/MyOrders";
const AdminOrders = lazy(() => import("./pages/admin/AdminOrders"));
const AdminLeadsImport = lazy(() => import("./pages/admin/AdminLeadsImport"));
import PublicReport from "./pages/report/PublicReport";
const EmailUnsubscribed = lazy(() => import("./pages/EmailUnsubscribed"));
import ThankYouRota60 from "./pages/thankyou/ThankYouRota60";
import ThankYouCurriculo from "./pages/thankyou/ThankYouCurriculo";
import NotFound from "./pages/NotFound";
import BookingFlow from "./pages/booking/BookingFlow";
import StudentBookings from "./pages/booking/StudentBookings";
import Community from "./pages/community/Community";
import PostDetail from "./pages/community/PostDetail";
import { ServiceGuard } from "./components/guards/ServiceGuard";
import PrimeJobs from "./pages/jobs/PrimeJobs";
import JobDetailsPage from "./pages/jobs/JobDetailsPage";
import JobDetailsWrapper from "./pages/jobs/JobDetailsWrapper";
import JobBookmarks from "./pages/jobs/JobBookmarks";
import JobAccessHistory from "./pages/jobs/JobAccessHistory";
import { AnalyticsTracker } from "./components/analytics/AnalyticsTracker";
import ServiceDetail from "./pages/services/ServiceDetail";
import ThankYouDetail from "./pages/services/ThankYouDetail";
const TitleTranslator = lazy(() => import("./pages/title-translator/TitleTranslator"));
import LeadFormPage from "./pages/lead-form/LeadFormPage";
import PricingPage from "./pages/pricing/PricingPage";
import SubscriptionSuccess from "./pages/pricing/SubscriptionSuccess";
import SubscriptionPage from "./pages/account/SubscriptionPage";
import LegalPage from "./pages/legal/LegalPage";
const AdminLegalPages = lazy(() => import("./pages/admin/AdminLegalPages"));
const AdminSubscriptionHealth = lazy(() => import("./pages/admin/AdminSubscriptionHealth"));
const AdminSystemHealth = lazy(() => import("./pages/admin/AdminSystemHealth"));
const AdminLeadsDashboard = lazy(() => import("./pages/admin/AdminLeadsDashboard"));
const AdminCustosApi = lazy(() => import("./pages/admin/AdminCustosApi"));
const AdminAnalytics = lazy(() => import("./pages/admin/AdminAnalytics"));
const AdminWeeklyReport = lazy(() => import("./pages/admin/AdminWeeklyReport"));
const AdminAgendaSemanal = lazy(() => import("./pages/admin/AdminAgendaSemanal"));
const AdminIdeaKanban = lazy(() => import("./pages/admin/AdminIdeaKanban"));
const AdminLeadDetail = lazy(() => import("./pages/admin/AdminLeadDetail"));
const AdminAtividades = lazy(() => import("./pages/admin/AdminAtividades"));
const AdminAutomations = lazy(() => import("./pages/admin/AdminAutomations"));
const AdminManyChatFlows = lazy(() => import("./pages/admin/AdminManyChatFlows"));
const AdminNotifications = lazy(() => import("./pages/admin/AdminNotifications"));
const AdminPrimeJobs = lazy(() => import("./pages/admin/AdminPrimeJobs"));
const AdminCourses = lazy(() => import("./pages/admin/AdminCourses"));
const AdminCourseBuilder = lazy(() => import("./pages/admin/AdminCourseBuilder"));
const AdminAgendamentos = lazy(() => import("./pages/admin/AdminAgendamentos"));
const AdminMenuConfig = lazy(() => import("./pages/admin/AdminMenuConfig"));
const AdminHubConfig = lazy(() => import("./pages/admin/AdminHubConfig"));
const AdminContentStudio = lazy(() => import("./pages/admin/AdminContentStudio"));
const AdminSDR = lazy(() => import("./pages/admin/AdminSDR"));
const MentorDisponibilidade = lazy(() => import("./pages/mentor/MentorDisponibilidade"));
const MentorLives = lazy(() => import("./pages/mentor/MentorLives"));
const MentorCreateLive = lazy(() => import("./pages/mentor/MentorCreateLive"));
const MentorLiveDetail = lazy(() => import("./pages/mentor/MentorLiveDetail"));
import StudentCourses from "./pages/student/StudentCourses";
import CoursePlayer from "./pages/student/CoursePlayer";
import LivesDiscovery from "./pages/lives/LivesDiscovery";
import LiveLandingPage from "./pages/lives/LiveLandingPage";
const AssistantLeadsDashboard = lazy(() => import("./pages/assistant/AssistantLeadsDashboard"));
const AssistantLeadDetail = lazy(() => import("./pages/assistant/AssistantLeadDetail"));
const AssistantAtividades = lazy(() => import("./pages/assistant/AssistantAtividades"));
const AssistantWeeklyReport = lazy(() => import("./pages/assistant/AssistantWeeklyReport"));


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
      student: '/dashboard/hub',
      mentor: '/mentor/dashboard',
      admin: '/admin/dashboard',
      assistant: '/assistant/leads',
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
      student: '/dashboard/hub',
      mentor: '/mentor/dashboard',
      admin: '/admin/dashboard',
      assistant: '/assistant/leads',
    };
    return <Navigate to={routes[user.role]} replace />;
  }
  
  return <>{children}</>;
}

function JobShareRedirect() {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={`/prime-jobs/${id}`} replace />;
}

function AppRoutes() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
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
      <Route path="/dashboard/hub" element={
        <ProtectedRoute allowedRoles={['student']}>
          <StudentHub />
        </ProtectedRoute>
      } />
      <Route path="/dashboard/hub-glass" element={
        <ProtectedRoute allowedRoles={['student', 'admin']}>
          <StudentHubGlass />
        </ProtectedRoute>
      } />
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
      <Route path="/dashboard/cursos" element={
        <ProtectedRoute allowedRoles={['student', 'admin']}>
          <StudentCourses />
        </ProtectedRoute>
      } />
      <Route path="/curso/:espacoId" element={
        <ProtectedRoute allowedRoles={['student', 'admin']}>
          <CoursePlayer />
        </ProtectedRoute>
      } />
      <Route path="/curso/:espacoId/:lessonId" element={
        <ProtectedRoute allowedRoles={['student', 'admin']}>
          <CoursePlayer />
        </ProtectedRoute>
      } />
      <Route path="/dashboard/agendamentos" element={
        <ProtectedRoute allowedRoles={['student']}>
          <StudentBookings />
        </ProtectedRoute>
      } />
      <Route path="/dashboard/agendar/:serviceId" element={
        <ProtectedRoute allowedRoles={['student', 'admin']}>
          <BookingFlow />
        </ProtectedRoute>
      } />
      <Route path="/catalogo" element={
        <ProtectedRoute allowedRoles={['student', 'mentor', 'admin']}>
          <ServiceCatalog />
        </ProtectedRoute>
      } />
      
      {/* Pricing & Subscription routes */}
      <Route path="/pricing" element={
        <ProtectedRoute allowedRoles={['student', 'mentor', 'admin']}>
          <PricingPage />
        </ProtectedRoute>
      } />
      <Route path="/subscription-success" element={
        <ProtectedRoute allowedRoles={['student', 'mentor', 'admin']}>
          <SubscriptionSuccess />
        </ProtectedRoute>
      } />
      {/* Legal Pages (public, no auth required) */}
      <Route path="/termos-assinatura" element={
        <LegalPage configKey="legal_termos_assinatura" title="Termos de Assinatura" />
      } />
      <Route path="/termos-de-uso" element={
        <LegalPage configKey="legal_termos_uso" title="Termos de Uso" />
      } />
      <Route path="/privacidade" element={
        <LegalPage configKey="legal_politica_privacidade" title="Política de Privacidade" />
      } />
      <Route path="/politica-privacidade" element={
        <LegalPage configKey="legal_politica_privacidade" title="Política de Privacidade" />
      } />
      <Route path="/politica-cancelamento" element={
        <LegalPage configKey="legal_politica_cancelamento" title="Política de Cancelamento" />
      } />

      {/* Profile route - accessible by all authenticated users */}
      <Route path="/perfil" element={
        <ProtectedRoute allowedRoles={['student', 'mentor', 'admin', 'assistant']}>
          <ProfilePage />
        </ProtectedRoute>
      } />
      <Route path="/dashboard/assinatura" element={
        <ProtectedRoute allowedRoles={['student', 'mentor', 'admin']}>
          <SubscriptionPage />
        </ProtectedRoute>
      } />
      
      {/* Global Library routes */}
      <Route path="/biblioteca" element={
        <ProtectedRoute allowedRoles={['student', 'mentor', 'admin']}>
          <GlobalLibrary />
        </ProtectedRoute>
      } />
      <Route path="/biblioteca/pasta/:folderId" element={
        <ProtectedRoute allowedRoles={['student', 'mentor', 'admin']}>
          <GlobalLibrary />
        </ProtectedRoute>
      } />
      <Route path="/biblioteca-global" element={<Navigate to="/biblioteca" replace />} />
      <Route path="/biblioteca-global/pasta/:folderId" element={<Navigate to="/biblioteca" replace />} />

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
      <Route path="/mentor/espacos/:id/editar" element={
        <ProtectedRoute allowedRoles={['mentor', 'admin']}>
          <MentorEditEspaco />
        </ProtectedRoute>
      } />
      <Route path="/mentor/espacos/:id" element={
        <ProtectedRoute allowedRoles={['mentor', 'admin']}>
          <MentorEspacoDetail />
        </ProtectedRoute>
      } />
      <Route path="/mentor/agendamentos" element={<Navigate to="/mentor/agenda" replace />} />
      <Route path="/mentor/disponibilidade" element={
        <ProtectedRoute allowedRoles={['mentor', 'admin']}>
          <MentorDisponibilidade />
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
      <Route path="/mentor/lives" element={
        <ProtectedRoute allowedRoles={['mentor', 'admin']}>
          <MentorLives />
        </ProtectedRoute>
      } />
      <Route path="/mentor/lives/nova" element={
        <ProtectedRoute allowedRoles={['mentor', 'admin']}>
          <MentorCreateLive />
        </ProtectedRoute>
      } />
      <Route path="/mentor/lives/:id" element={
        <ProtectedRoute allowedRoles={['mentor', 'admin']}>
          <MentorLiveDetail />
        </ProtectedRoute>
      } />
      <Route path="/mentor/lives/:id/editar" element={
        <ProtectedRoute allowedRoles={['mentor', 'admin']}>
          <MentorCreateLive />
        </ProtectedRoute>
      } />

      {/* Admin routes */}
      <Route path="/admin/dashboard" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminDashboard />
        </ProtectedRoute>
      } />
      <Route path="/admin/agendamentos" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminAgendamentos />
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
          <AdminHubServices />
        </ProtectedRoute>
      } />
      <Route path="/admin/relatorios" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminReports />
        </ProtectedRoute>
      } />
      <Route path="/admin/auditoria" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminAuditLogs />
        </ProtectedRoute>
      } />
      <Route path="/admin/biblioteca-global" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminGlobalLibrary />
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
      <Route path="/admin/lista-espera" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminWaitlist />
        </ProtectedRoute>
      } />
      <Route path="/admin/menu-config" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminMenuConfig />
        </ProtectedRoute>
      } />
      <Route path="/admin/hub-config" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminHubConfig />
        </ProtectedRoute>
      } />
      <Route path="/admin/configuracoes" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminSettings />
        </ProtectedRoute>
      } />
      <Route path="/admin/configuracoes-apis" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminApis />
        </ProtectedRoute>
      } />
      <Route path="/admin/email-templates" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminEmailTemplates />
        </ProtectedRoute>
      } />
      <Route path="/admin/campanhas-email" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminEmailCampaigns />
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
      <Route path="/admin/pedidos" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminOrders />
        </ProtectedRoute>
      } />
      <Route path="/admin/ticto-simulator" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminTictoSimulator />
        </ProtectedRoute>
      } />
      <Route path="/admin/subscription-health" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminSubscriptionHealth />
        </ProtectedRoute>
      } />
      <Route path="/admin/saude-sistema" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminSystemHealth />
        </ProtectedRoute>
      } />
      <Route path="/admin/leads" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminLeadsImport />
        </ProtectedRoute>
      } />
      <Route path="/admin/leads-dashboard" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminLeadsDashboard />
        </ProtectedRoute>
      } />
      <Route path="/admin/leads/:id" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminLeadDetail />
        </ProtectedRoute>
      } />
      <Route path="/admin/atividades" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminAtividades />
        </ProtectedRoute>
      } />
      <Route path="/admin/custos-api" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminCustosApi />
        </ProtectedRoute>
      } />
      <Route path="/admin/analytics" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminAnalytics />
        </ProtectedRoute>
      } />
      <Route path="/admin/agenda-semanal" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminAgendaSemanal />
        </ProtectedRoute>
      } />
      <Route path="/admin/inteligencia-semanal" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminWeeklyReport />
        </ProtectedRoute>
      } />
      <Route path="/admin/idea-kanban" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminIdeaKanban />
        </ProtectedRoute>
      } />
      <Route path="/admin/automacoes" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminAutomations />
        </ProtectedRoute>
      } />
      <Route path="/admin/manychat-flows" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminManyChatFlows />
        </ProtectedRoute>
      } />
      <Route path="/admin/notificacoes" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminNotifications />
        </ProtectedRoute>
      } />
      <Route path="/admin/prime-jobs" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminPrimeJobs />
        </ProtectedRoute>
      } />
      <Route path="/admin/content-studio" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminContentStudio />
        </ProtectedRoute>
      } />
      <Route path="/admin/sdr" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminSDR />
        </ProtectedRoute>
      } />
      <Route path="/admin/paginas-legais" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminLegalPages />
        </ProtectedRoute>
      } />
      <Route path="/admin/cursos" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminCourses />
        </ProtectedRoute>
      } />
      <Route path="/admin/cursos/:id" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminCourseBuilder />
        </ProtectedRoute>
      } />

      {/* Public Report Access (no auth required) */}
      <Route path="/report/:token" element={<PublicReport />} />

      {/* Email unsubscribe confirmation (public, redirected from Edge Function) */}
      <Route path="/email/unsubscribed" element={<EmailUnsubscribed />} />

      {/* Lead Form (public, no auth - served on report.euanapratica.com) */}
      <Route path="/avaliar" element={<LeadFormPage />} />
      
      {/* Thank You Pages (public, post-payment redirects) */}
      <Route path="/thank-you/rota60min" element={<ThankYouRota60 />} />
      <Route path="/thank-you/curriculo" element={<ThankYouCurriculo />} />
      {/* Dynamic Thank You Pages (generated from hub_services config) */}
      <Route path="/thank-you/:slug" element={<ThankYouDetail />} />

      {/* Lives routes */}
      <Route path="/lives" element={
        <ProtectedRoute allowedRoles={['student', 'mentor', 'admin']}>
          <LivesDiscovery />
        </ProtectedRoute>
      } />
      <Route path="/live/:slug" element={
        <ProtectedRoute allowedRoles={['student', 'mentor', 'admin']}>
          <LiveLandingPage />
        </ProtectedRoute>
      } />

      {/* Service Landing Pages (in-platform) */}
      <Route path="/servicos/:slug" element={
        <ProtectedRoute allowedRoles={['student', 'mentor', 'admin']}>
          <ServiceDetail />
        </ProtectedRoute>
      } />

      {/* Payment Success - post-checkout redirect */}
      <Route path="/payment-success" element={
        <ProtectedRoute allowedRoles={['student', 'mentor', 'admin']}>
          <PaymentSuccess />
        </ProtectedRoute>
      } />
      
      {/* Meus Pedidos - user order history */}
      <Route path="/meus-pedidos" element={
        <ProtectedRoute allowedRoles={['student', 'mentor', 'admin']}>
          <MyOrders />
        </ProtectedRoute>
      } />

      {/* Comunidade - protected by ServiceGuard */}
      <Route path="/comunidade" element={
        <ProtectedRoute allowedRoles={['student', 'mentor', 'admin']}>
          <ServiceGuard serviceRoute="/comunidade">
            <Community />
          </ServiceGuard>
        </ProtectedRoute>
      } />
      <Route path="/comunidade/:id" element={
        <ProtectedRoute allowedRoles={['student', 'mentor', 'admin']}>
          <ServiceGuard serviceRoute="/comunidade">
            <PostDetail />
          </ServiceGuard>
        </ProtectedRoute>
      } />

      {/* Prime Jobs - accessible by all authenticated users */}
      <Route path="/prime-jobs" element={
        <ProtectedRoute allowedRoles={['student', 'mentor', 'admin']}>
          <PrimeJobs />
        </ProtectedRoute>
      } />
      {/* Public-accessible: wrapper shows preview for unauthenticated, full for authenticated */}
      <Route path="/prime-jobs/:id" element={<JobDetailsWrapper />} />
      {/* Share URL alias — Vercel rewrite handles this server-side for OG tags; client-side redirect as fallback */}
      <Route path="/vaga/:id" element={<JobShareRedirect />} />
      <Route path="/prime-jobs/bookmarks" element={
        <ProtectedRoute allowedRoles={['student', 'mentor', 'admin']}>
          <ServiceGuard serviceRoute="/prime-jobs/bookmarks">
            <JobBookmarks />
          </ServiceGuard>
        </ProtectedRoute>
      } />
      <Route path="/prime-jobs/historico" element={
        <ProtectedRoute allowedRoles={['student', 'mentor', 'admin']}>
          <JobAccessHistory />
        </ProtectedRoute>
      } />

      {/* ResumePass - protected by ServiceGuard */}
      <Route path="/curriculo" element={
        <ProtectedRoute allowedRoles={['student', 'mentor', 'admin']}>
          <ServiceGuard serviceRoute="/curriculo">
            <CurriculoUSA />
          </ServiceGuard>
        </ProtectedRoute>
      } />
      <Route path="/curriculo/resultado" element={
        <ProtectedRoute allowedRoles={['student', 'mentor', 'admin']}>
          <ServiceGuard serviceRoute="/curriculo">
            <CurriculoReport />
          </ServiceGuard>
        </ProtectedRoute>
      } />
      <Route path="/resumepass/report/:id" element={
        <ProtectedRoute allowedRoles={['student', 'mentor', 'admin']}>
          <ServiceGuard serviceRoute="/curriculo">
            <SavedReportPage />
          </ServiceGuard>
        </ProtectedRoute>
      } />

      {/* Title Translator - Job Title Match */}
      <Route path="/title-translator" element={
        <ProtectedRoute allowedRoles={['student', 'mentor', 'admin']}>
          <ServiceGuard serviceRoute="/title-translator">
            <TitleTranslator />
          </ServiceGuard>
        </ProtectedRoute>
      } />

      {/* Assistant (Customer Associate) routes */}
      <Route path="/assistant/leads" element={
        <ProtectedRoute allowedRoles={['assistant']}>
          <AssistantLeadsDashboard />
        </ProtectedRoute>
      } />
      <Route path="/assistant/leads/:id" element={
        <ProtectedRoute allowedRoles={['assistant']}>
          <AssistantLeadDetail />
        </ProtectedRoute>
      } />
      <Route path="/assistant/atividades" element={
        <ProtectedRoute allowedRoles={['assistant']}>
          <AssistantAtividades />
        </ProtectedRoute>
      } />
      <Route path="/assistant/inteligencia-semanal" element={
        <ProtectedRoute allowedRoles={['assistant']}>
          <AssistantWeeklyReport />
        </ProtectedRoute>
      } />

      {/* Legacy /hub redirect */}
      <Route path="/hub" element={<Navigate to="/" replace />} />

      {/* Catch-all */}
      <Route path="*" element={<NotFound />} />
    </Routes>
    </Suspense>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AnalyticsTracker />
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);


export default App;


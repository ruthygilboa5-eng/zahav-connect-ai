import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from '@/hooks/useAuth';
import { USE_PREVIEW_MAIN_USER } from '@/config/preview';
import ProtectedRoute from '@/components/ProtectedRoute';
import PreviewBanner from '@/components/PreviewBanner';
import AuthPage from '@/pages/AuthPage';
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import WakeUpPage from "./pages/WakeUpPage";
import EmergencyPage from "./pages/EmergencyPage";
import EmergencyContactsPage from "./pages/EmergencyContactsPage";
import EmergencyApprovalPage from "./pages/EmergencyApprovalPage";
import RemindersPage from "./pages/RemindersPage";
import MemoriesPage from "./pages/MemoriesPage";
import GamesPage from "./pages/GamesPage";
import FamilyBoardPage from "./pages/FamilyBoardPage";
import FamilyDashboardPage from "./pages/FamilyDashboardPage";

const queryClient = new QueryClient();

function AppRoutes() {
  const { userRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">טוען...</p>
        </div>
      </div>
    );
  }

  // In preview mode, redirect directly to main user home
  if (USE_PREVIEW_MAIN_USER) {
    return (
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/wakeup" element={<WakeUpPage />} />
        <Route path="/emergency" element={<EmergencyPage />} />
        <Route path="/emergency-contacts" element={<EmergencyContactsPage />} />
        <Route path="/reminders" element={<RemindersPage />} />
        <Route path="/memories" element={<MemoriesPage />} />
        <Route path="/games" element={<GamesPage />} />
        <Route path="/family-board" element={<FamilyBoardPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      
      {/* Main User Routes */}
      <Route path="/" element={
        <ProtectedRoute requireRole="main_user">
          <Index />
        </ProtectedRoute>
      } />
      <Route path="/wakeup" element={
        <ProtectedRoute requireRole="main_user">
          <WakeUpPage />
        </ProtectedRoute>
      } />
      <Route path="/emergency" element={
        <ProtectedRoute requireRole="main_user">
          <EmergencyPage />
        </ProtectedRoute>
      } />
      <Route path="/emergency-contacts" element={
        <ProtectedRoute requireRole="main_user">
          <EmergencyContactsPage />
        </ProtectedRoute>
      } />
      <Route path="/reminders" element={
        <ProtectedRoute requireRole="main_user">
          <RemindersPage />
        </ProtectedRoute>
      } />
      <Route path="/memories" element={
        <ProtectedRoute requireRole="main_user">
          <MemoriesPage />
        </ProtectedRoute>
      } />
      <Route path="/games" element={
        <ProtectedRoute requireRole="main_user">
          <GamesPage />
        </ProtectedRoute>
      } />
      <Route path="/family-board" element={
        <ProtectedRoute requireRole="main_user">
          <FamilyBoardPage />
        </ProtectedRoute>
      } />

      {/* Family Dashboard Routes */}
      <Route path="/family-dashboard" element={
        <ProtectedRoute>
          <FamilyDashboardPage />
        </ProtectedRoute>
      } />

      {/* Emergency Approval (public) */}
      <Route path="/emergency-approval/:token" element={<EmergencyApprovalPage />} />

      {/* Redirect based on role */}
      <Route path="/dashboard" element={
        userRole === 'main_user' ? <Navigate to="/" replace /> :
        userRole === 'family_basic' || userRole === 'family_emergency' ? <Navigate to="/family-dashboard" replace /> :
        <Navigate to="/auth" replace />
      } />

      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <PreviewBanner />
        <AppRoutes />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

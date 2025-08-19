import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/providers/AuthProvider";
import { DataProvider } from "@/providers/DataProvider";
import { FamilyProvider } from "@/providers/FamilyProvider";
import AppLayout from "@/components/AppLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import LandingPage from "./pages/LandingPage";
import HomePage from "./pages/HomePage";
import FamilyPage from "./pages/FamilyPage";
import NotFound from "./pages/NotFound";
import WakeUpPage from "./pages/WakeUpPage";
import EmergencyPage from "./pages/EmergencyPage";
import EmergencyContactsPage from "./pages/EmergencyContactsPage";
import EmergencyApprovalPage from "./pages/EmergencyApprovalPage";
import RemindersPage from "./pages/RemindersPage";
import MemoriesPage from "./pages/MemoriesPage";
import GamesPage from "./pages/GamesPage";
import FamilyManagementPage from "./pages/FamilyManagementPage";
import FamilyBoardPage from "./pages/FamilyBoardPage";
import ReviewPage from "./pages/ReviewPage";
import FamilyDashboardPage from "./pages/FamilyDashboardPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <FamilyProvider>
          <DataProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
            <AppLayout>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/home" element={
                  <ProtectedRoute requiredRole="MAIN_USER">
                    <HomePage />
                  </ProtectedRoute>
                } />
                <Route path="/family" element={
                  <ProtectedRoute requiredRole="FAMILY">
                    <FamilyDashboardPage />
                  </ProtectedRoute>
                } />
                <Route path="/wakeup" element={
                  <ProtectedRoute requiredRole="MAIN_USER">
                    <WakeUpPage />
                  </ProtectedRoute>
                } />
                <Route path="/emergency" element={
                  <ProtectedRoute requiredRole="MAIN_USER">
                    <EmergencyPage />
                  </ProtectedRoute>
                } />
                <Route path="/emergency-contacts" element={
                  <ProtectedRoute requiredRole="MAIN_USER">
                    <EmergencyContactsPage />
                  </ProtectedRoute>
                } />
                <Route path="/emergency-approval" element={
                  <ProtectedRoute>
                    <EmergencyApprovalPage />
                  </ProtectedRoute>
                } />
                <Route path="/reminders" element={
                  <ProtectedRoute requiredRole="MAIN_USER">
                    <RemindersPage />
                  </ProtectedRoute>
                } />
                <Route path="/memories" element={
                  <ProtectedRoute requiredRole="MAIN_USER">
                    <MemoriesPage />
                  </ProtectedRoute>
                } />
                <Route path="/games" element={
                  <ProtectedRoute requiredRole="MAIN_USER">
                    <GamesPage />
                  </ProtectedRoute>
                } />
                <Route path="/family-management" element={
                  <ProtectedRoute requiredRole="MAIN_USER">
                    <FamilyManagementPage />
                  </ProtectedRoute>
                } />
                <Route path="/family-board" element={
                  <ProtectedRoute requiredRole="MAIN_USER">
                    <FamilyBoardPage />
                  </ProtectedRoute>
                } />
                <Route path="/review" element={
                  <ProtectedRoute requiredRole="MAIN_USER">
                    <ReviewPage />
                  </ProtectedRoute>
                } />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AppLayout>
          </BrowserRouter>
          </DataProvider>
        </FamilyProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

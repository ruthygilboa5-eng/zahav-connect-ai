import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/providers/AuthProvider";
import { GlobalStateProvider } from "@/providers/GlobalStateProvider";
import { DataProvider } from "@/providers/DataProvider";
import { FamilyProvider } from "@/providers/FamilyProvider";
import { OwnerProvider } from "@/providers/OwnerProvider";
import { SupabaseProvider } from "@/providers/SupabaseProvider";
import AppLayout from "@/components/AppLayout";
import GlobalStateWrapper from "@/components/GlobalStateWrapper";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppInitializer from "@/components/AppInitializer";
import Index from "./pages/Index";
import HomePage from "./pages/HomePage";
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
import FamilyDashboard from "./components/FamilyDashboard";
import DashboardPage from "./pages/DashboardPage";
import WaitingApprovalPage from "./pages/WaitingApprovalPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
    <AuthProvider>
      <BrowserRouter>
        <GlobalStateProvider>
          <SupabaseProvider>
            <OwnerProvider>
              <FamilyProvider>
                <DataProvider>
                  <GlobalStateWrapper>
                    <AppLayout>
                      <Routes>
                        <Route path="/" element={<Index />} />
                        <Route path="/dashboard" element={
                          <ProtectedRoute requiredRole="FAMILY">
                            <DashboardPage />
                          </ProtectedRoute>
                        } />
                        <Route path="/waiting-approval" element={
                          <ProtectedRoute requiredRole="FAMILY">
                            <WaitingApprovalPage />
                          </ProtectedRoute>
                        } />
                        <Route path="/home" element={
                          <ProtectedRoute requiredRole="MAIN_USER">
                            <HomePage />
                          </ProtectedRoute>
                        } />
                        <Route path="/family" element={
                          <ProtectedRoute requiredRole="MAIN_USER">
                            <FamilyDashboard />
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
                  </GlobalStateWrapper>
                  <Toaster />
                  <Sonner />
                </DataProvider>
              </FamilyProvider>
            </OwnerProvider>
          </SupabaseProvider>
        </GlobalStateProvider>
      </BrowserRouter>
    </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

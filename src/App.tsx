import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/providers/AuthProvider";
import { DataProvider } from "@/providers/DataProvider";
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
import FamilyBoardPage from "./pages/FamilyBoardPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
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
                    <FamilyPage />
                  </ProtectedRoute>
                } />
                <Route path="/wakeup" element={
                  <ProtectedRoute>
                    <WakeUpPage />
                  </ProtectedRoute>
                } />
                <Route path="/emergency" element={
                  <ProtectedRoute>
                    <EmergencyPage />
                  </ProtectedRoute>
                } />
                <Route path="/emergency-contacts" element={
                  <ProtectedRoute>
                    <EmergencyContactsPage />
                  </ProtectedRoute>
                } />
                <Route path="/emergency-approval" element={
                  <ProtectedRoute>
                    <EmergencyApprovalPage />
                  </ProtectedRoute>
                } />
                <Route path="/reminders" element={
                  <ProtectedRoute>
                    <RemindersPage />
                  </ProtectedRoute>
                } />
                <Route path="/memories" element={
                  <ProtectedRoute>
                    <MemoriesPage />
                  </ProtectedRoute>
                } />
                <Route path="/games" element={
                  <ProtectedRoute>
                    <GamesPage />
                  </ProtectedRoute>
                } />
                <Route path="/family-board" element={
                  <ProtectedRoute>
                    <FamilyBoardPage />
                  </ProtectedRoute>
                } />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AppLayout>
          </BrowserRouter>
        </DataProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

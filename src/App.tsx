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
      <BrowserRouter>
        <AuthProvider>
          {/* Starting with minimal provider chain to test stability */}
          <div className="min-h-screen w-full bg-white relative">
            {/* Background */}
            <div
              className="absolute inset-0 z-0"
              style={{
                backgroundImage: `
                  radial-gradient(125% 125% at 50% 90%, #ffffff 40%, #f59e0b 100%)
                `,
                backgroundSize: "100% 100%",
              }}
            />
            <div className="relative z-10">
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/dashboard" element={
                  <ProtectedRoute requiredRole="FAMILY">
                    <DashboardPage />
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
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
          </div>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

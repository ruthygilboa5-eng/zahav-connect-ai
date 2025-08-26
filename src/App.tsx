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
        {/* Remove AuthProvider temporarily to isolate the issue */}
        <div className="min-h-screen w-full bg-white relative">
          <div className="absolute inset-0 z-0" style={{
            backgroundImage: `radial-gradient(125% 125% at 50% 90%, #ffffff 40%, #f59e0b 100%)`,
            backgroundSize: "100% 100%",
          }} />
          <div className="relative z-10 p-8">
            <h1 className="text-2xl font-bold mb-4">Debug: Testing without AuthProvider</h1>
            <p>Current route: {window.location.pathname}</p>
            <Routes>
              <Route path="/" element={<div>Home route - no auth</div>} />
              <Route path="/family" element={<div>Family route - no auth needed</div>} />
              <Route path="*" element={<div>Catch-all route</div>} />
            </Routes>
          </div>
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

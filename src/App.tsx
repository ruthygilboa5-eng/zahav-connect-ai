import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { FixedAuthProvider } from "@/providers/FixedAuthProvider";
import { GlobalStateProvider } from "@/providers/GlobalStateProvider";
import { DataProvider } from "@/providers/DataProvider";
import { FamilyProvider } from "@/providers/FamilyProvider";
import { OwnerProvider } from "@/providers/OwnerProvider";
import ProtectedRoute from "@/components/ProtectedRoute";
import SimpleIndex from "./pages/SimpleIndex";
import HomePage from "./pages/HomePage";
import RemindersPage from "./pages/RemindersPage";
import MemoriesPage from "./pages/MemoriesPage";
import ReviewPage from "./pages/ReviewPage";
import EmergencyContactsPage from "./pages/EmergencyContactsPage";
import WakeUpPage from "./pages/WakeUpPage";
import EmergencyPage from "./pages/EmergencyPage";
import GamesPage from "./pages/GamesPage";
import FamilyBoardPage from "./pages/FamilyBoardPage";
import FamilyManagementPage from "./pages/FamilyManagementPage";
import FamilyDashboard from "./components/FamilyDashboard";
import NotFound from "./pages/NotFound";
import FamilyMemberSignup from "./components/FamilyMemberSignup";

const queryClient = new QueryClient();

const App = () => {
  console.log('App rendering with AuthProvider...');
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <FixedAuthProvider>
            <GlobalStateProvider>
              <DataProvider>
                <OwnerProvider>
                  <FamilyProvider>
            <div className="min-h-screen w-full bg-white relative">
              {/* Amber Glow Background */}
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
                  <Route path="/" element={<SimpleIndex />} />
                  
                  {/* Registration Routes */}
                  <Route path="/register-family-member" element={
                    <FamilyMemberSignup 
                      onComplete={() => window.location.href = '/'}
                      onBack={() => window.location.href = '/'}
                    />
                  } />
                  
                  {/* Main User Routes */}
                  <Route path="/home" element={
                    <ProtectedRoute requiredRole="MAIN_USER">
                      <HomePage />
                    </ProtectedRoute>
                  } />
                  
                  {/* Family Member Routes */}
                  <Route path="/family" element={
                    <ProtectedRoute requiredRole="FAMILY">
                      <FamilyDashboard />
                    </ProtectedRoute>
                  } />
                  
                  {/* Shared Routes */}
                  <Route path="/memories" element={<MemoriesPage />} />
                  <Route path="/reminders" element={<RemindersPage />} />
                  <Route path="/emergency-contacts" element={<EmergencyContactsPage />} />
                  <Route path="/wakeup" element={<WakeUpPage />} />
                  <Route path="/emergency" element={<EmergencyPage />} />
                  <Route path="/games" element={<GamesPage />} />
                  <Route path="/family-board" element={<FamilyBoardPage />} />
                  
                  {/* Cleanup: Redirect old duplicate routes to main page */}
                  <Route path="/family-management" element={<Navigate to="/" replace />} />
                  <Route path="/review" element={<Navigate to="/" replace />} />
                  
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </div>
            </div>
                    <Toaster />
                    <Sonner />
                  </FamilyProvider>
                </OwnerProvider>
              </DataProvider>
            </GlobalStateProvider>
          </FixedAuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
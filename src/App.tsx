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
import FamilyPage from "./pages/FamilyPage";
import NotFound from "./pages/NotFound";
import { FamilyAuthChoiceWrapper, FamilyMemberSignupWrapper } from "./components/FamilyRouteWrappers";
import FamilyRequestsPage from "./pages/FamilyRequestsPage";
import AdminPage from "./pages/AdminPage";
import AdminLoginPage from "./pages/AdminLoginPage";
import AdminSetupPage from "./pages/AdminSetupPage";
import { AuthNavigationHandler } from "./components/AuthNavigationHandler";

const queryClient = new QueryClient();

const App = () => {
  console.log('App rendering with AuthProvider...');
  
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <FixedAuthProvider>
          <GlobalStateProvider>
            <DataProvider>
              <OwnerProvider>
                <FamilyProvider>
                  <TooltipProvider>
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
                        <AuthNavigationHandler />
                        <Routes>
                          <Route path="/" element={<SimpleIndex />} />
                          
                          {/* Admin Routes */}
                          <Route path="/admin-login" element={<AdminLoginPage />} />
                          <Route path="/admin-setup" element={<AdminSetupPage />} />
                          
                           {/* Family Auth Routes */}
                            <Route path="/family-auth" element={<FamilyAuthChoiceWrapper />} />
                            <Route path="/register-family-member" element={<FamilyMemberSignupWrapper />} />
                          
                          {/* Family Requests Management - Main User Only */}
                          <Route path="/family-requests" element={
                            <ProtectedRoute requiredRole="MAIN_USER">
                              <FamilyRequestsPage />
                            </ProtectedRoute>
                          } />
                          
                          {/* Protected Routes - Role-based content */}
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
                          
                          {/* Shared Routes */}
                          <Route path="/memories" element={<MemoriesPage />} />
                          <Route path="/reminders" element={<RemindersPage />} />
                          <Route path="/emergency-contacts" element={<EmergencyContactsPage />} />
                          <Route path="/wakeup" element={<WakeUpPage />} />
                          <Route path="/emergency" element={<EmergencyPage />} />
                          <Route path="/games" element={<GamesPage />} />
                          <Route path="/family-board" element={<FamilyBoardPage />} />
                          
                           {/* Family Management - Main User Only */}
                           <Route path="/family-management" element={
                             <ProtectedRoute requiredRole="MAIN_USER">
                               <FamilyManagementPage />
                             </ProtectedRoute>
                           } />
                           
                           {/* Admin Dashboard - Admin Only */}
                           <Route path="/admin-dashboard" element={
                             <ProtectedRoute requiredRole="ADMIN">
                               <AdminPage />
                             </ProtectedRoute>
                           } />
                           
                           {/* Clean redirects for removed routes */}
                           <Route path="/review" element={<Navigate to="/" replace />} />
                          
                          <Route path="*" element={<NotFound />} />
                        </Routes>
                      </div>
                    </div>
                    <Toaster />
                    <Sonner />
                  </TooltipProvider>
                </FamilyProvider>
              </OwnerProvider>
            </DataProvider>
          </GlobalStateProvider>
        </FixedAuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
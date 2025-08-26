import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { FixedAuthProvider } from "@/providers/FixedAuthProvider";
import { GlobalStateProvider } from "@/providers/GlobalStateProvider";
import { DataProvider } from "@/providers/DataProvider";
import { FamilyProvider } from "@/providers/FamilyProvider";
import { OwnerProvider } from "@/providers/OwnerProvider";
import SimpleIndex from "./pages/SimpleIndex";
import HomePage from "./pages/HomePage";
import DashboardPage from "./pages/DashboardPage";
import RemindersPage from "./pages/RemindersPage";
import MemoriesPage from "./pages/MemoriesPage";
import ReviewPage from "./pages/ReviewPage";
import EmergencyContactsPage from "./pages/EmergencyContactsPage";
import NotFound from "./pages/NotFound";

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
                  <Route path="/home" element={<HomePage />} />
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/family" element={<DashboardPage />} />
                  <Route path="/memories" element={<MemoriesPage />} />
                  <Route path="/reminders" element={<RemindersPage />} />
                  <Route path="/review" element={<ReviewPage />} />
                  <Route path="/emergency-contacts" element={<EmergencyContactsPage />} />
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
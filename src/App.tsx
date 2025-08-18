import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Index from "./pages/Index";
import EvolutionDashboard from "./pages/EvolutionDashboard";
import EvolutionDashboardSimple from "./pages/EvolutionDashboardSimple";
import N8nDashboard from "./pages/N8nDashboard";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Admin from "./pages/Admin";
import Profile from "./pages/Profile";
import { GoogleAuthCallback } from "./pages/GoogleAuthCallback";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardProtectedRoute from "./components/DashboardProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <HashRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<Index />} />
              <Route path="/evolution" element={
                <DashboardProtectedRoute requiredDashboard="evolution" dashboardName="Evolution Dashboard">
                  <EvolutionDashboard />
                </DashboardProtectedRoute>
              } />
              <Route path="/evolution-simple" element={
                <DashboardProtectedRoute requiredDashboard="evolution" dashboardName="Evolution Dashboard Simple">
                  <EvolutionDashboardSimple />
                </DashboardProtectedRoute>
              } />
              <Route path="/secretaria" element={
                <DashboardProtectedRoute requiredDashboard="secretaria" dashboardName="Secretaria Dashboard">
                  <EvolutionDashboardSimple />
                </DashboardProtectedRoute>
              } />
              <Route path="/n8n" element={
                <DashboardProtectedRoute requiredDashboard="n8n" dashboardName="N8n Dashboard">
                  <N8nDashboard />
                </DashboardProtectedRoute>
              } />
              <Route path="/admin" element={<Admin />} />
              <Route path="/profile" element={<Profile />} />
            </Route>
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </HashRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
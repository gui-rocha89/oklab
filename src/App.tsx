import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { ProjectProvider } from "@/contexts/ProjectContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { RoleBasedDashboard } from "@/components/RoleBasedDashboard";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import Feedbacks from "./pages/Feedbacks";
import Team from "./pages/Team";
import Settings from "./pages/Settings";
import AudiovisualApproval from "./pages/AudiovisualApproval";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <ProjectProvider>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/aprovacao-audiovisual/:shareId" element={<AudiovisualApproval />} />
              <Route path="/" element={
                <ProtectedRoute>
                  <Layout>
                    <RoleBasedDashboard />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/projetos" element={
                <ProtectedRoute>
                  <Layout>
                    <Projects />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/feedbacks" element={
                <ProtectedRoute>
                  <Layout>
                    <Feedbacks />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/equipe" element={
                <ProtectedRoute requiredRoles={['supreme_admin', 'manager']}>
                  <Layout>
                    <Team />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/configuracoes" element={
                <ProtectedRoute requiredRoles={['supreme_admin']}>
                  <Layout>
                    <Settings />
                  </Layout>
                </ProtectedRoute>
              } />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </ProjectProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

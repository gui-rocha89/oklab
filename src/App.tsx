import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { ProjectProvider } from "@/contexts/ProjectContext";
import { UserProvider } from "@/contexts/UserContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import Feedbacks from "./pages/Feedbacks";
import Team from "./pages/Team";
import Settings from "./pages/Settings";
import AudiovisualApproval from "./pages/AudiovisualApproval";
import ClientApproval from "./pages/ClientApproval";
import ClientReturn from "./pages/ClientReturn";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange={false}
    >
      <UserProvider>
        <ProjectProvider>
          <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/aprovacao-audiovisual/:shareId" element={<AudiovisualApproval />} />
          <Route path="/projeto/:shareId" element={<ClientApproval />} />
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
          <Route path="/retorno-cliente/:projectId" element={
            <ProtectedRoute>
              <Layout>
                <ClientReturn />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/equipe" element={
            <ProtectedRoute>
              <Layout>
                <Team />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/configuracoes" element={
            <ProtectedRoute>
              <Layout>
                <Settings />
              </Layout>
            </ProtectedRoute>
          } />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </BrowserRouter>
      </TooltipProvider>
      </ProjectProvider>
    </UserProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;

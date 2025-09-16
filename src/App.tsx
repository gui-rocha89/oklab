import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { ProjectProvider } from "@/contexts/ProjectContext";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import Feedbacks from "./pages/Feedbacks";
import Team from "./pages/Team";
import Settings from "./pages/Settings";
import AudiovisualApproval from "./pages/AudiovisualApproval";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ProjectProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
        <Routes>
          <Route path="/" element={
            <Layout>
              <Dashboard />
            </Layout>
          } />
          <Route path="/aprovacao-audiovisual/:shareId" element={
            <Layout>
              <AudiovisualApproval />
            </Layout>
          } />
          <Route path="/projetos" element={
            <Layout>
              <Projects />
            </Layout>
          } />
          <Route path="/feedbacks" element={
            <Layout>
              <Feedbacks />
            </Layout>
          } />
          <Route path="/equipe" element={
            <Layout>
              <Team />
            </Layout>
          } />
          <Route path="/configuracoes" element={
            <Layout>
              <Settings />
            </Layout>
          } />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
    </ProjectProvider>
  </QueryClientProvider>
);

export default App;

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import Dashboard from "./pages/Dashboard";
import AudiovisualApproval from "./pages/AudiovisualApproval";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
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
              <Dashboard />
            </Layout>
          } />
          <Route path="/feedbacks" element={
            <Layout>
              <Dashboard />
            </Layout>
          } />
          <Route path="/equipe" element={
            <Layout>
              <Dashboard />
            </Layout>
          } />
          <Route path="/configuracoes" element={
            <Layout>
              <Dashboard />
            </Layout>
          } />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

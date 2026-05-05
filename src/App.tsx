import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import ClientSurvey from "./pages/ClientSurvey";
import SurveyTemplates from "./pages/SurveyTemplates";
import NotFound from "./pages/NotFound";

const ADMIN_DOMAIN = "@station16.com";
const queryClient = new QueryClient();

function isAdmin(email: string | undefined | null): boolean {
  return !!email && email.toLowerCase().endsWith(ADMIN_DOMAIN);
}

function AdminRoute() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/" replace />;
  return <AdminDashboard user={user} />;
}

function TemplatesRoute() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user || !isAdmin(user.email)) return <Navigate to="/" replace />;
  return <SurveyTemplates user={user} />;
}

function HomeRoute() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (isAdmin(user?.email)) return <Navigate to="/admin" replace />;
  return <Login user={user} />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomeRoute />} />
          <Route path="/admin" element={<AdminRoute />} />
          <Route path="/admin/templates" element={<TemplatesRoute />} />
          <Route path="/survey/:uid" element={<ClientSurvey />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

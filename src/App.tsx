import { Layout } from "@/components/Layout";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import AccountsPayablePage from "@/pages/AccountsPayablePage";
import AccountsReceivablePage from "@/pages/AccountsReceivablePage";
import Login from "@/pages/Login";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Appointments from "./components/Appointments";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={<Navigate to="/accounts-payable" replace />}
            />
            <Route
              path="/accounts-payable"
              element={
                <Layout>
                  <AccountsPayablePage />
                </Layout>
              }
            />
            <Route
              path="/accounts-receivable"
              element={
                <Layout>
                  <AccountsReceivablePage />
                </Layout>
              }
            />
            <Route
              path="/appointments"
              element={
                <Layout>
                  <Appointments />
                </Layout>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

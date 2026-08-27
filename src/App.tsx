import { Layout } from "@/components/Layout";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import AccountsPayablePage from "@/pages/AccountsPayablePage";
import AccountsReceivablePage from "@/pages/AccountsReceivablePage";
import AdminUsersPage from "@/pages/AdminUsersPage";
import AdminSystemCompaniesPage from "@/pages/AdminSystemCompaniesPage";
import Login from "@/pages/Login";
import PaymentRequestsPage from "@/pages/PaymentRequestsPage";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Appointments from "./components/Appointments";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

/**
 * Corrige um bug conhecido do Radix UI (usado pelos componentes Dialog/AlertDialog/Select do
 * shadcn): ao abrir, ele marca `document.body.style.pointerEvents = "none"` e libera clique só
 * para a camada (modal) do topo; ao fechar, deveria restaurar. Esse controle é feito por uma
 * variável global compartilhada entre todas as instâncias, e quebra quando há um modal aberto
 * "dentro" de outro (ex: Select com busca dentro de um Dialog, usado nas telas de contas a
 * pagar/receber e solicitações de pagamento) — o `pointer-events: none` fica preso no body e a
 * aplicação inteira para de responder a clique até dar F5.
 *
 * Aqui detectamos esse estado (body travado sem nenhum overlay do Radix de fato aberto) e
 * liberamos o clique de novo, sem precisar recarregar a página.
 */
function useRadixStuckPointerEventsFix() {
  useEffect(() => {
    const fixIfStuck = () => {
      if (
        document.body.style.pointerEvents === "none" &&
        document.querySelectorAll('[data-state="open"]').length === 0
      ) {
        document.body.style.pointerEvents = "";
      }
    };

    const observer = new MutationObserver(fixIfStuck);
    observer.observe(document.body, { attributes: true, attributeFilter: ["style"] });

    // Rede de segurança extra, caso alguma mutação passe despercebida pelo observer.
    const interval = window.setInterval(fixIfStuck, 1000);

    return () => {
      observer.disconnect();
      window.clearInterval(interval);
    };
  }, []);
}

const App = () => {
  useRadixStuckPointerEventsFix();

  return (
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
                  <Layout requiredPage="accounts-payable">
                    <AccountsPayablePage />
                  </Layout>
                }
              />
              <Route
                path="/accounts-receivable"
                element={
                  <Layout requiredPage="accounts-receivable">
                    <AccountsReceivablePage />
                  </Layout>
                }
              />
              <Route
                path="/appointments"
                element={
                  <Layout requiredPage="appointments">
                    <Appointments />
                  </Layout>
                }
              />
              <Route
                path="/payment-requests"
                element={
                  <Layout requiredPage="payment-requests">
                    <PaymentRequestsPage />
                  </Layout>
                }
              />
              <Route
                path="/admin/usuarios"
                element={
                  <Layout adminOnly>
                    <AdminUsersPage />
                  </Layout>
                }
              />
              <Route
                path="/admin/empresas-sistema"
                element={
                  <Layout adminOnly>
                    <AdminSystemCompaniesPage />
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
};

export default App;

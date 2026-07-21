import type { PageKey } from "@/contexts/AuthContext";
import { Calendar, CreditCard, Receipt } from "lucide-react";

export interface PageConfig {
  key: PageKey;
  title: string;
  url: string;
  icon: typeof CreditCard;
}

/** Fonte única das páginas do módulo Financeiro: usada no menu, no gate de rota e na tela de admin. */
export const APP_PAGES: PageConfig[] = [
  { key: "accounts-payable", title: "Contas a Pagar", url: "/accounts-payable", icon: CreditCard },
  { key: "accounts-receivable", title: "Contas a Receber", url: "/accounts-receivable", icon: Receipt },
  { key: "appointments", title: "Agendamentos", url: "/appointments", icon: Calendar },
  { key: "payment-requests", title: "Solicitações de Pagamento", url: "/payment-requests", icon: CreditCard },
];

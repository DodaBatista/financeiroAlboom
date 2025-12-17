import { callAPI } from "../utils/api";

export interface AccountPlan {
  id: string;
  name: string;
  id_name: string;
  code?: string;
  subtype: string;
}

export const fetchAccountPlansService = async (): Promise<AccountPlan[]> => {
  try {
    // Buscar Centros de Custo (C) e Despesas (D) em paralelo
    const [costs, expenses] = await Promise.all([
      callAPI("accounts?subtype=C", {}, "GET"),
      callAPI("accounts?subtype=D", {}, "GET")
    ]);

    // Combinar os resultados
    const combined = [...(costs || []), ...(expenses || [])];
    
    return combined
  } catch (error) {
    console.error("Erro ao buscar planos de contas:", error);
    return [];
  }
};

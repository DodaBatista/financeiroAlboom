import { callAPISmart } from "../utils/api";

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
      callAPISmart("accounts?subtype=C", {}, "GET"),
      callAPISmart("accounts?subtype=D", {}, "GET")
    ]);

    // Combinar os resultados
    const combined = [...(costs || []), ...(expenses || [])];
    
    return combined
  } catch (error) {
    console.error("Erro ao buscar planos de contas:", error);
    return [];
  }
};

import { callAPI } from "../utils/api";
import { getProcessedTitles } from "./processedTitlesService";

export interface Title {
    id: string;
    memo: string;
    add_date: string;
    due_date: string;
    amount: string;
    customer_name: string;
    customer_lastname: string;
    document_number?: string;
    document_type_name?: string;
    order_id?: string;
    user_name: string;
    user_avatar: string;
}

export interface FetchTitlesRequest {
    pageNumber: number;
    pageSize: number;
    start_date: string;
    end_date: string;
    type: "ap" | "ar",
    class_id: string;
    doc_type: string;
    customer_id: string | null;
    groupBy: string | null;
    period: string;
    csv_mode: number;
    searchTerm: string;
    sortBy: string;
    sortDir: "ASC" | "DESC";
}

interface FetchTitlesResponse {
    titulos: any[];
    count: number;
}

export const fetchTitlesService = async (
    data: FetchTitlesRequest
): Promise<FetchTitlesResponse> => {
    try {
        const response = await callAPI(
            "account_trans/paginate_apr",
            data,
            "POST"
        );

         return {
      titulos: response.rows || [],
      count: Number(response.count) || 0,
    };
    } catch (error) {
        console.error("Erro ao buscar títulos:", error);
        throw error;
    }
};

export const getAvailableTitles = async (
  data: FetchTitlesRequest
): Promise<FetchTitlesResponse> => {
  const { titulos, count } = await fetchTitlesService(data);
  const processed = await getProcessedTitles(data.type);

  const processedIds = new Set(processed.map((p: any) => p.id_titulo));
  const filtered = titulos.filter(t => !processedIds.has(t.id));
  
  return {
    titulos: filtered,
    count: count,
  };
};
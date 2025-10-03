import { callAPI } from "@/utils/api";

export const fetchEventTypesService = async (): Promise<any[]> => {
  try {
    const response = await callAPI(
      "eventtypes",
      {},
      "GET"
    );

    return response || [];
  } catch (error) {
    console.error("Erro ao buscar tipos de evento:", error);
    throw error;
  }
};

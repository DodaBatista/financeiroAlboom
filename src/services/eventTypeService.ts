import { callAPISmart } from "@/utils/api";

export const fetchEventTypesService = async (): Promise<any[]> => {
  try {
    const response = await callAPISmart(
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

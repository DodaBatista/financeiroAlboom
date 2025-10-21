import { clearAuthTokens, getAuthTokens } from "../utils/api";
import { getCompanyFromUrl } from "../utils/company";

export const API_BASE_URL = 'https://n8np7.risystems.online/webhook/scheduling';

export const getProcessedAppointments = async (filters: any): Promise<any> => {
  try {

    const empresa = getCompanyFromUrl();
    const tokens = getAuthTokens();

    if (!tokens) throw new Error("No authentication tokens available");

    const payload = {
      empresa,
      page: filters?.page || 1,
      limit: filters?.limit || 100,
      status: filters?.status || "",
      type_event: filters?.type_event || "",
      start_date: filters?.start_date || "",
      end_date: filters?.end_date || "",
    };

    const response = await fetch(`${API_BASE_URL}/processed`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "iduseralboom": "",
        "tokenalboom": tokens.tokenAlboom,
        Authorization: `Bearer ${tokens.token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        clearAuthTokens();
        window.location.href = "/login";
        throw new Error("Session expired. Please login again.");
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    const parsed = Array.isArray(result) ? result[0] : result;

    return {
      success: parsed?.success || false,
      data: parsed?.data || [],
      pagination: parsed?.pagination || {},
    };

  } catch (error) {
    console.error("Erro na exportação:", error);
    throw error;
  }
};

export async function exportProcessedAppointments(filters: any) {
  try {
    const empresa = getCompanyFromUrl();
    filters = { empresa, ...filters };

    const response = await fetch(
      `${API_BASE_URL}/processed/export`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(filters),
      }
    );

    if (!response.ok) {
      throw new Error("Falha ao exportar registros processados.");
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `processados_${new Date().toISOString().split("T")[0]}.xlsx`;
    document.body.appendChild(a);
    a.click();
    a.remove();

    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Erro na exportação:", error);
    throw error;
  }
}

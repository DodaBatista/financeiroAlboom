import { API_BASE_URL, clearAuthTokens, getAuthTokens } from "../utils/api";
import { getCompanyFromUrl } from "../utils/company";

export const getProcessedAppointments = async (): Promise<any> => {
  const empresa = getCompanyFromUrl();
  const tokens = getAuthTokens();

  if (!tokens) {
    throw new Error("No authentication tokens available");
  }

  try {
    const url = `${API_BASE_URL}/scheduling/processed?empresa=${empresa}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "iduseralboom": "",
        "tokenalboom": tokens.tokenAlboom,
        Authorization: `Bearer ${tokens.token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        clearAuthTokens();
        window.location.href = "/login";
        throw new Error("Session expired. Please login again.");
      }

      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Get processed appointments failed:", error);
    throw error;
  }
};
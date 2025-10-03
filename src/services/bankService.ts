import { callAPI } from "../utils/api";

export const bankService = {
  fetchBanks: async () => {
    const response = await callAPI(
      "banks/paginate",
      {
        type: "all",
        class_id: "all",
        pageNumber: 1,
        pageSize: 9999,
        sortBy: "name",
        sortDir: "ASC",
        searchTerm: "",
      },
      "POST"
    );

    return (response?.rows || []).map((item: any) => ({
      id: item.id,
      name: item.name,
      category_id: item.category_id,
      account_code: item.account_code,
      active: item.active,
    })).filter((bank) => bank.active === "1");
  },
};
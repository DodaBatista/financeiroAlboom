import { callAPI } from "../utils/api";

export interface Freelancer {
  id: string;
  name: string;
  lastname: string;
  email: string;
}


export const fetchFreelancersService = async (
  searchTerm: string
): Promise<Freelancer[]> => {
  try {
    const payload = {
      type: "freelance",
      pageNumber: 1,
      pageSize: 999999,
      sortBy: "name",
      sortDir: "ASC",
      searchTerm: searchTerm || "",
    };

    const response = await callAPI("users/paginate", payload, "POST");

    return (
      response?.rows
        ?.filter((item: any) => item.active === "1")
        .map((item: any) => ({
          id: item.id,
          name: item.name,
          email: item.email,
          avatar: item.avatar,
        })) || []
    );
  } catch (error) {
    console.error("Erro ao buscar freelancers:", error);
    return [];
  }
};

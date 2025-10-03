import { callAPI } from "../utils/api";

export interface Contact {
  id: string;
  name: string;
  lastname: string;
  email: string;
  company?: string;
}

export const fetchContactsService = async (
  searchTerm: string,
  type: string
): Promise<Contact[]> => {
  try {
    const payload = {
      type,
      class_id: "all",
      role: "contact",
      pageNumber: 1,
      pageSize: 999999,
      sortBy: "name",
      sortDir: "ASC",
      searchTerm: searchTerm || "",
    };

    const response = await callAPI("contacts/paginate", payload, "POST");

    return (
      response?.rows?.map((item: any) => ({
        id: item.id,
        name: item.is_company === "1" ? item.company : item.name,
        lastname: item.lastname,
        email: item.email,
        avatar: item.avatar,
      })) || []
    );
  } catch (error) {
    console.error("Erro ao buscar contatos:", error);
    return [];
  }
};

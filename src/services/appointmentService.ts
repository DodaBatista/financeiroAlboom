import { callAPI } from "@/utils/api";
import { getCompanyFromUrl } from "../utils/company";

export interface AppointmentQuery {
    pageNumber: number;
    pageSize: number;
    start_date: string;
    end_date: string;
    type?: string;
    status?: string;
    sortBy?: string;
    sortDir?: "ASC" | "DESC";
    searchTerm?: string;
}

interface FetchAppointmentsResponse {
    appointments: any[];
    total: number;
}

export const fetchAppointments = async (params: AppointmentQuery): Promise<FetchAppointmentsResponse> => {
    const empresa = getCompanyFromUrl();

    const requestData = {
        start_type: "other",
        type: params.type || "",
        class_id: "all",
        status: params.status || "All",
        user: "all",
        pageNumber: params.pageNumber || 1,
        pageSize: params.pageSize || 100,
        sortBy: params.sortBy || "start_date",
        sortDir: params.sortDir || "ASC",
        searchTerm: params.searchTerm || "",
        start_date: params.start_date,
        end_date: params.end_date,
        is_csv: 0,
    };
    try {
        const response = await callAPI("events/paginate", requestData, "POST");

        return {
            appointments: response.rows || [],
            total: parseInt(response.count || "0", 10),
        };
    } catch (error) {
        console.error("Fetch appointments failed:", error);
        throw error;
    }
};
import { callAPIProxy } from "@/utils/api";
import { getProcessedAppointments } from "./processedAppointmentsService";

export interface AppointmentQuery {
    pageNumber: number;
    pageSize: number;
    start_date: string;
    end_date: string;
    type?: string;
    status?: string;
    sortBy?: string;
    sortDir?: "ASC" | "DESC";
}

interface FetchAppointmentsResponse {
    appointments: any[];
    total: number;
}

export const fetchAppointmentsService = async (params: any): Promise<{ appointments: any[]; total: number }> => {
    try {
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

        const response = await callAPIProxy(
            "events/paginate",
            requestData,
            "POST"
        );

        return {
            appointments: response.rows || [],
            total: parseInt(response.count || "0", 10),
        };
    } catch (error) {
        console.error("Erro ao buscar agendamentos:", error);
        throw error;
    }
};

export const fetchFilteredAppointmentsService = async (
    query: AppointmentQuery
): Promise<FetchAppointmentsResponse> => {
    const { appointments, total } = await fetchAppointmentsService(query);

    const processed = await getProcessedAppointments();

    const filtered = appointments.filter(
        (a) => !processed.some((p) => p.id === a.id)
    );

    return { appointments: filtered, total };
};

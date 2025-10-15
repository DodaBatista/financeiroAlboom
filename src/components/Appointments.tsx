import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import {
  AlertCircle,
  CheckCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Loader2,
  RefreshCw,
  RotateCcw,
  Search,
} from "lucide-react";
import { useEffect, useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { fetchFilteredAppointmentsService } from "@/services/appointmentService";
import { fetchEventTypesService } from "@/services/eventTypeService";
import { getProcessedAppointments } from "@/services/processedAppointmentsService";
import { callAPIN8N } from "@/utils/api";

interface Appointment {
  id: string;
  target_id?: string;
  title: string;
  event_type_name: string;
  event_type_color: string;
  start_date: string;
  end_date: string;
  status: string;
  user_name: string;
  user_avatar: string;
  participants: Array<any>;
}

interface EventType {
  id: string;
  name: string;
}

interface AppointmentProcessed {
  id: string;
  status: string;
  order_id: string;
  type_event: string;
  mensagem: string;
}

const Appointments = () => {
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [processedAppointments, setProcessedAppointments] = useState<
    AppointmentProcessed[]
  >([]);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedEventType, setSelectedEventType] = useState("");
  const [reprocessingLoading, setReprocessingLoading] = useState(false);
  const [processAppointmentLoading, setProcessAppointmentLoading] =
    useState(false);
  const [selectedAppointmentStatus, setSelectedAppointmentStatus] =
    useState("all");

  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "ASC" | "DESC";
  } | null>(null);

  const [selectedAppointments, setSelectedAppointments] = useState<Set<string>>(
    new Set()
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(100);
  const [totalAppointments, setTotalAppointments] = useState(0);

  const [filteredAppointments, setFilteredAppointments] = useState<
    Appointment[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [requestsLoading, setRequestsLoading] = useState(false);

  const [activeTab, setActiveTab] = useState("appointments");

  const [selectedStatus, setSelectedStatus] = useState("default");

  const [processAppointmentModal, setProcessAppointmentModal] = useState<{
    isOpen: boolean;
    type: "single" | "multiple";
    appointment?: Appointment;
    selectedCount?: number;
  }>({ isOpen: false, type: "single" });

  const [reprocessModal, setReprocessModal] = useState<{
    isOpen: boolean;
    appointmentId?: string;
  }>({ isOpen: false });

  const [hasFetchedInitialList, setHasFetchedInitialList] = useState(false);

  const fetchEventTypes = async () => {
    try {
      const types = await fetchEventTypesService();
      setEventTypes(types);
    } catch (error) {
      toast({
        title: "Erro ao carregar tipos de pagamento",
        description: "Não foi possível carregar a lista de tipos de pagamento.",
        variant: "destructive",
      });
    }
  };

  const fetchAppointments = async (
    sort?: { key: string; direction: "ASC" | "DESC" } | null
  ) => {
    if (!startDate || !endDate) return;

    setAppointments([]);
    setFilteredAppointments([]);
    setLoading(true);

    try {
      const requestData: any = {
        pageNumber: currentPage,
        pageSize: itemsPerPage,
        start_date: startDate,
        end_date: endDate,
        type: selectedEventType || "",
        status:
          selectedAppointmentStatus !== "all" ? selectedAppointmentStatus : "",
      };

      const effectiveSort = sort ?? sortConfig;
      if (effectiveSort) {
        requestData.sortBy = effectiveSort.key;
        requestData.sortDir = effectiveSort.direction;
      }

      const { appointments, total } = await fetchFilteredAppointmentsService(
        requestData
      );

      setAppointments(appointments);
      setFilteredAppointments(appointments);
      setTotalAppointments(total);
    } catch (error) {
      toast({
        title: "Erro ao carregar agendamentos",
        description: "Não foi possível carregar a lista de agendamentos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProcessedAppointments = async () => {
    setRequestsLoading(true);
    try {
      const response = await getProcessedAppointments();
      setProcessedAppointments(response || []);
    } catch (error) {
      toast({
        title: "Erro ao carregar processamentos solicitados",
        description:
          "Não foi possível carregar a lista de registros processados.",
        variant: "destructive",
      });
    } finally {
      setRequestsLoading(false);
    }
  };

  useEffect(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    setStartDate(firstDay.toISOString().split("T")[0]);
    setEndDate(lastDay.toISOString().split("T")[0]);
  }, []);

  useEffect(() => {
    if (!hasFetchedInitialList && startDate && endDate) {
      fetchAppointments();
      setHasFetchedInitialList(true);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchEventTypes();
  }, []);

  useEffect(() => {
    if (startDate && endDate) {
      fetchAppointments();
    }
  }, [currentPage, itemsPerPage]);

  useEffect(() => {
    if (activeTab === "requests") {
      fetchProcessedAppointments();
    }
  }, [activeTab]);

  useEffect(() => {
    setSortConfig({ key: "start_date", direction: "ASC" });
  }, []);

  const totalPages = Math.ceil(totalAppointments / itemsPerPage);
  const paginatedAppointments = filteredAppointments;

  const handleFilter = () => {
    setCurrentPage(1);
    setSelectedAppointments(new Set());
    fetchAppointments();
  };

  const handleSort = (columnKey: string) => {
    let direction: "ASC" | "DESC" | null = "ASC";

    if (sortConfig && sortConfig.key === columnKey) {
      if (sortConfig.direction === "ASC") {
        direction = "DESC";
      } else {
        direction = null;
      }
    }

    if (direction) {
      const newConfig = { key: columnKey, direction };
      setSortConfig(newConfig);
      fetchAppointments(newConfig);
    } else {
      setSortConfig(null);
      fetchAppointments(null);
    }

    setCurrentPage(1);
  };

  const getSortIcon = (columnKey: string) => {
    if (!sortConfig || sortConfig.key !== columnKey) {
      return null;
    }
    return sortConfig.direction === "ASC" ? (
      <ChevronUp className="inline w-4 h-4 ml-1" />
    ) : (
      <ChevronDown className="inline w-4 h-4 ml-1" />
    );
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedAppointments(new Set(paginatedAppointments.map((t) => t.id)));
    } else {
      setSelectedAppointments(new Set());
    }
  };

  const translateAppointmentStatus = (status: string) => {
    switch (status) {
      case "Confirmed":
        return "Confirmado";
      case "Scheduled":
        return "Agendado";
      case "On going":
        return "Em Andamento";
      case "Rescheduled":
        return "Reagendado";
      case "Completed":
        return "Concluído";
      case "Cancelled":
        return "Cancelado";
      default:
        return status;
    }
  };

  function getContrastColor(hex: string) {
    if (!hex) return "#000";
    const c = hex.substring(1);
    const rgb = parseInt(c, 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = (rgb >> 0) & 0xff;
    const luma = 0.299 * r + 0.587 * g + 0.114 * b;
    return luma > 186 ? "#000" : "#fff";
  }

  const handleSelectAppointment = (appointmentId: string, checked: boolean) => {
    const newSelected = new Set(selectedAppointments);
    if (checked) {
      newSelected.add(appointmentId);
    } else {
      newSelected.delete(appointmentId);
    }
    setSelectedAppointments(newSelected);
  };

  const handleSingleProcessAppointment = (appointment: Appointment) => {
    setProcessAppointmentModal({
      isOpen: true,
      type: "single",
      appointment,
    });
  };

  const handleMultipleProcessAppointment = () => {
    setProcessAppointmentModal({
      isOpen: true,
      type: "multiple",
      selectedCount: selectedAppointments.size,
    });
  };

  const confirmProcessAppointment = async () => {
    setProcessAppointmentLoading(true);

    const appointmentsToProcess =
      processAppointmentModal.type === "single"
        ? [processAppointmentModal.appointment!]
        : Array.from(selectedAppointments)
            .map((id) => appointments.find((t) => t.id === id)!)
            .filter(Boolean);

    const payload = appointmentsToProcess.map((appointment) => ({
      id: appointment.id,
      order_id: appointment.target_id,
      name: appointment.title,
      type: appointment.event_type_name
    }));

    try {
      await callAPIN8N(null, { Agendamento: payload}, "scheduling/clear_accounts");

      if (processAppointmentModal.type === "single") {
        toast({
          title: "Processamento realizado",
          description: `Agendamento ${processAppointmentModal.appointment?.id} processado com sucesso`,
        });
      } else {
        toast({
          title: "Processamentos realizados",
          description: `${processAppointmentModal.selectedCount} processados com sucesso`,
        });
        setSelectedAppointments(new Set());
      }

      fetchAppointments();
    } catch (error) {
      toast({
        title: "Erro no processamento",
        description: "Não foi possível processar o pagamento. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setProcessAppointmentLoading(false);
    }

    setProcessAppointmentModal({ isOpen: false, type: "single" });
  };

  const handleRefresh = () => {
    fetchProcessedAppointments();
  };

  const handleReprocess = (appointmentId: string) => {
    setReprocessModal({ isOpen: true, appointmentId });
  };

  const confirmReprocess = async () => {
    if (!reprocessModal.appointmentId) return;

    setReprocessingLoading(true);
    try {
      const request = processedAppointments.find(
        (req) => req.id === reprocessModal.appointmentId
      );
      if (!request) {
        toast({
          title: "Erro",
          description: "Dados do agendamento não encontrados",
          variant: "destructive",
        });
        return;
      }

      const payload = [
        {
          id: request.id,
          status: request.status,
          order_id: request.order_id,
          type_event: request.type_event,
          mensagem: request.mensagem,
        },
      ];

      await callAPIN8N(null, { Agendamento: payload}, "scheduling/clear_accounts");

      toast({
        title: "Reprocessamento bem-sucedido",
        description: "Processamento realizado com sucesso",
        variant: "default",
        className: "bg-green-50 border-green-200 text-green-800",
      });

      fetchProcessedAppointments();
    } catch (error) {
      toast({
        title: "Erro no reprocessamento",
        description: "Não foi possível reprocessar. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setReprocessingLoading(false);
    }

    setReprocessModal({ isOpen: false });
  };

  const filteredProcessedAppointments =
    selectedStatus === "default" || !selectedStatus
      ? processedAppointments
      : processedAppointments.filter(
          (request) => request.status === selectedStatus
        );

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "Sucesso":
        return "success";
      case "Processado":
        return "success";
      case "Processando":
        return "secondary";
      case "Erro":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getStatusBadgeIcon = (status: string) => {
    switch (status) {
      case "Sucesso":
        return <CheckCircle className="w-3 h-3 mr-1" />;
      case "Processado":
        return <CheckCircle className="w-3 h-3 mr-1" />;
      case "Processando":
        return <Clock className="w-3 h-3 mr-1" />;
      case "Erro":
        return <AlertCircle className="w-3 h-3 mr-1" />;
      default:
        return null;
    }
  };

  const formatDate = (date: string) => {
    const [year, month, day] = date.split("-");
    const dateObj = new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day)
    );
    return dateObj.toLocaleDateString("pt-BR");
  };

  const isFilterDisabled = !startDate || !endDate;

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background p-4 md:p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-foreground">Agendamentos</h1>
          </div>

          {/* Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="appointments">Não Processados</TabsTrigger>
              <TabsTrigger value="requests">Processados</TabsTrigger>
            </TabsList>

            {/* Tab 1: Agendamentos a processar */}
            <TabsContent value="appointments" className="space-y-6">
              {/* Filtros */}
              <Card className="shadow-card animate-fade-in">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="h-5 w-5 text-primary" />
                    Filtros
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Linha 1: Filtros principais */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Data Inicial *
                        </label>
                        <Input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          required
                          className="w-full"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Data Final *
                        </label>
                        <Input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          required
                          className="w-full"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Tipo de Evento
                        </label>
                        <Select
                          value={selectedEventType}
                          onValueChange={setSelectedEventType}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                          <SelectContent className="z-50 max-h-[300px] overflow-y-auto bg-popover">
                            <SelectItem value="all">Todos os tipos</SelectItem>
                            {eventTypes.map((type) => (
                              <SelectItem key={type.id} value={type.id}>
                                {type.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Status
                        </label>
                        <Select
                          value={selectedAppointmentStatus}
                          onValueChange={setSelectedAppointmentStatus}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o status" />
                          </SelectTrigger>
                          <SelectContent className="z-50 max-h-[300px] overflow-y-auto bg-popover">
                            <SelectItem value="all">Todos</SelectItem>
                            <SelectItem value="Confirmed">
                              Confirmado
                            </SelectItem>
                            <SelectItem value="Scheduled">Agendado</SelectItem>
                            <SelectItem value="On going">
                              Em Andamento
                            </SelectItem>
                            <SelectItem value="Rescheduled">
                              Reagendado
                            </SelectItem>
                            <SelectItem value="Completed">Concluído</SelectItem>
                            <SelectItem value="Cancelled">Cancelado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Linha 2 e 3: Entidade, seleção e ações */}
                    {/* Mobile: layout empilhado */}
                    <div className="block md:hidden space-y-4">
                      {/* Ações - Mobile */}
                      <div className="flex flex-col gap-4">
                        <Button
                          onClick={handleFilter}
                          disabled={isFilterDisabled}
                          className="w-full"
                          variant="default"
                        >
                          <Search className="h-4 w-4 mr-2" />
                          Filtrar
                        </Button>

                        <Button
                          variant="payment"
                          onClick={handleMultipleProcessAppointment}
                          disabled={selectedAppointments.size === 0}
                          className="w-full"
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Processar selecionados ({selectedAppointments.size})
                        </Button>
                      </div>
                    </div>

                    {/* Desktop: layout em linha única */}
                    <div className="hidden md:flex items-end gap-4">
                      {/* Lado direito: Botões de ação */}
                      <div className="flex items-center gap-4">
                        <Button
                          onClick={handleFilter}
                          disabled={isFilterDisabled}
                          variant="default"
                        >
                          <Search className="h-4 w-4 mr-2" />
                          Filtrar
                        </Button>

                        <Button
                          variant="payment"
                          onClick={handleMultipleProcessAppointment}
                          disabled={selectedAppointments.size === 0}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Processar ({selectedAppointments.size})
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tabela / Cards */}
              <Card className="shadow-financial animate-fade-in">
                <CardContent className="p-0">
                  {/* Desktop Table */}
                  <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted/50 border-b">
                        <tr>
                          <th className="p-4 text-left">
                            <Checkbox
                              checked={
                                selectedAppointments.size ===
                                  paginatedAppointments.length &&
                                paginatedAppointments.length > 0
                              }
                              onCheckedChange={(checked) =>
                                handleSelectAll(checked as boolean)
                              }
                              disabled={loading}
                            />
                          </th>
                          <th
                            className="p-4 text-left text-sm font-medium cursor-pointer hover:bg-muted/30 transition-colors"
                            onClick={() => handleSort("id")}
                          >
                            ID {getSortIcon("id")}
                          </th>
                          <th
                            className="p-4 text-left text-sm font-medium cursor-pointer hover:bg-muted/30 transition-colors"
                            onClick={() => handleSort("target_id")}
                          >
                            Pedido {getSortIcon("target_id")}
                          </th>
                          <th
                            className="p-4 text-left text-sm font-medium cursor-pointer hover:bg-muted/30 transition-colors"
                            onClick={() => handleSort("title")}
                          >
                            Título {getSortIcon("title")}
                          </th>
                          <th
                            className="p-4 text-left text-sm font-medium cursor-pointer hover:bg-muted/30 transition-colors"
                            onClick={() => handleSort("event_type_name")}
                          >
                            Tipo de Evento {getSortIcon("event_type_name")}
                          </th>
                          <th
                            className="p-4 text-left text-sm font-medium cursor-pointer hover:bg-muted/30 transition-colors"
                            onClick={() => handleSort("start_date")}
                          >
                            Início {getSortIcon("start_date")}
                          </th>
                          <th
                            className="p-4 text-left text-sm font-medium cursor-pointer hover:bg-muted/30 transition-colors"
                            onClick={() => handleSort("status")}
                          >
                            Status {getSortIcon("status")}
                          </th>
                          <th
                            className="p-4 text-left text-sm font-medium cursor-pointer hover:bg-muted/30 transition-colors"
                            onClick={() => handleSort("user_name")}
                          >
                            Usuário {getSortIcon("user_name")}
                          </th>
                          <th
                            className="p-4 text-left text-sm font-medium cursor-pointer hover:bg-muted/30 transition-colors"
                            onClick={() => handleSort("participants")}
                          >
                            Participantes {getSortIcon("participants")}
                          </th>
                          <th className="p-4 text-left text-sm font-medium">
                            Ação
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {loading ? (
                          <tr>
                            <td colSpan={11} className="p-8 text-center">
                              <div className="flex items-center justify-center">
                                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                                <span>Carregando agendamentos...</span>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          (() => {
                            const validAppointments =
                              paginatedAppointments.filter(
                                (appointment) => appointment.id
                              );
                            if (validAppointments.length === 0) {
                              return (
                                <tr>
                                  <td
                                    colSpan={11}
                                    className="p-8 text-center text-muted-foreground"
                                  >
                                    Nenhum agendamento encontrado com os filtros
                                    selecionados.
                                  </td>
                                </tr>
                              );
                            }
                            return validAppointments.map((appointment) => (
                              <tr
                                key={appointment.id}
                                className="border-b hover:bg-muted/20 transition-colors"
                              >
                                <td className="p-4">
                                  <Checkbox
                                    checked={selectedAppointments.has(
                                      appointment.id
                                    )}
                                    onCheckedChange={(checked) =>
                                      handleSelectAppointment(
                                        appointment.id,
                                        checked as boolean
                                      )
                                    }
                                  />
                                </td>
                                <td className="p-4 text-sm">
                                  {appointment.id}
                                </td>
                                <td className="p-4 text-sm">
                                  {appointment.target_id || "-"}
                                </td>
                                <td className="p-4 text-sm">
                                  {appointment.title}
                                </td>
                                <td className="p-4">
                                  <Badge
                                    style={{
                                      backgroundColor:
                                        appointment.event_type_color,
                                      color: getContrastColor(
                                        appointment.event_type_color
                                      ),
                                    }}
                                  >
                                    {appointment.event_type_name}
                                  </Badge>
                                </td>
                                <td className="p-4 text-sm">
                                  {formatDate(appointment.start_date)}
                                </td>
                                <td className="p-4 text-sm">
                                  {translateAppointmentStatus(
                                    appointment.status
                                  )}
                                </td>
                                <td className="p-4 flex items-center gap-2">
                                  <Avatar className="h-6 w-6">
                                    <AvatarImage
                                      src={appointment.user_avatar}
                                    />
                                    <AvatarFallback></AvatarFallback>
                                  </Avatar>
                                  {appointment.user_name}
                                </td>
                                <td className="p-4 text-sm">
                                  {appointment.participants?.length || 0}
                                </td>

                                <td className="p-4">
                                  <Button
                                    variant="payment"
                                    size="sm"
                                    onClick={() =>
                                      handleSingleProcessAppointment(
                                        appointment
                                      )
                                    }
                                  >
                                    <CheckCircle2 className="h-4 w-4" />
                                  </Button>
                                </td>
                              </tr>
                            ));
                          })()
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards */}
                  <div
                    className={`lg:hidden space-y-4 p-4 ${
                      loading ? "opacity-50" : ""
                    }`}
                  >
                    {(() => {
                      const validAppointments = paginatedAppointments.filter(
                        (appointment) => appointment.id
                      );
                      if (validAppointments.length === 0 && !loading) {
                        return (
                          <div className="text-center p-8 text-muted-foreground">
                            Nenhum agendamento encontrado com os filtros
                            selecionados.
                          </div>
                        );
                      }
                      return validAppointments.map((appointment) => (
                        <Card key={appointment.id} className="shadow-sm">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <Checkbox
                                  checked={selectedAppointments.has(
                                    appointment.id
                                  )}
                                  onCheckedChange={(checked) =>
                                    handleSelectAppointment(
                                      appointment.id,
                                      checked as boolean
                                    )
                                  }
                                />
                                <Badge variant="outline">
                                  {appointment.id}
                                </Badge>
                              </div>
                              <Button
                                variant="payment"
                                size="sm"
                                onClick={() =>
                                  handleSingleProcessAppointment(appointment)
                                }
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            </div>

                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">
                                  Pedido:
                                </span>
                                <span className="text-sm">
                                  {appointment.target_id || "-"}
                                </span>
                              </div>

                              <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">
                                  Título:
                                </span>
                                <span className="text-sm">
                                  {appointment.title}
                                </span>
                              </div>

                              <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">
                                  Tipo:
                                </span>
                                <Badge
                                  style={{
                                    backgroundColor:
                                      appointment.event_type_color,
                                    color: getContrastColor(
                                      appointment.event_type_color
                                    ),
                                  }}
                                >
                                  {appointment.event_type_name}
                                </Badge>
                              </div>

                              <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">
                                  Início:
                                </span>
                                <span className="text-sm">
                                  {formatDate(appointment.start_date)}
                                </span>
                              </div>

                              <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">
                                  Fim:
                                </span>
                                <span className="text-sm">
                                  {formatDate(appointment.end_date)}
                                </span>
                              </div>

                              <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">
                                  Status:
                                </span>
                                <span className="text-sm">
                                  {translateAppointmentStatus(
                                    appointment.status
                                  )}
                                </span>
                              </div>

                              <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">
                                  Participantes:
                                </span>
                                <span className="text-sm">
                                  {appointment.participants?.length || 0}
                                </span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ));
                    })()}
                  </div>
                </CardContent>
              </Card>

              {/* Paginação */}
              <Card className="shadow-card">
                <CardContent className="py-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground">
                        Página {currentPage} de {totalPages}
                      </span>

                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          Itens por página:
                        </span>
                        <Select
                          value={itemsPerPage.toString()}
                          onValueChange={(value) => {
                            setItemsPerPage(Number(value));
                            setCurrentPage(1);
                          }}
                        >
                          <SelectTrigger className="w-20">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="25">25</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                            <SelectItem value="100">100</SelectItem>
                            <SelectItem value="150">150</SelectItem>
                            <SelectItem value="200">200</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setCurrentPage((p) => Math.max(1, p - 1))
                        }
                        disabled={currentPage === 1 || loading}
                      >
                        Anterior
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setCurrentPage((p) => Math.min(totalPages, p + 1))
                        }
                        disabled={currentPage === totalPages || loading}
                      >
                        Próxima
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab 2: Processamentos Solicitados */}
            <TabsContent value="requests" className="space-y-6">
              {/* Filtros para Processamentos Solicitados */}
              <Card className="shadow-card animate-fade-in">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="h-5 w-5 text-primary" />
                    Filtros
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Status
                      </label>
                      <Select
                        value={selectedStatus}
                        onValueChange={setSelectedStatus}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Todos os status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="default">
                            Todos os status
                          </SelectItem>
                          <SelectItem value="Sucesso">Sucesso</SelectItem>
                          <SelectItem value="Processando">
                            Processando
                          </SelectItem>
                          <SelectItem value="Erro">Erro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-end">
                      <Button
                        onClick={handleRefresh}
                        className="w-full"
                        variant="outline"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Atualizar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tabela de Registros Processados */}
              <Card className="shadow-financial animate-fade-in">
                <CardContent className="p-0">
                  {requestsLoading && (
                    <div className="flex items-center justify-center p-8">
                      <Loader2 className="h-6 w-6 animate-spin mr-2" />
                      <span>Carregando registros processados...</span>
                    </div>
                  )}
                  {/* Desktop Table */}
                  <div
                    className={`hidden lg:block overflow-x-auto ${
                      requestsLoading ? "opacity-50" : ""
                    }`}
                  >
                    <table className="w-full">
                      <thead className="bg-muted/50 border-b">
                        <tr>
                          <th className="p-4 text-left text-sm font-medium">
                            ID
                          </th>
                          <th className="p-4 text-left text-sm font-medium">
                            Status
                          </th>
                          <th className="p-4 text-left text-sm font-medium">
                            Pedido
                          </th>
                          <th className="p-4 text-left text-sm font-medium">
                            Tipo de Evento
                          </th>
                          <th className="p-4 text-left text-sm font-medium">
                            Mensagem
                          </th>
                          <th className="p-4 text-left text-sm font-medium">
                            Ação
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredProcessedAppointments.length === 0 &&
                        !requestsLoading ? (
                          <tr>
                            <td
                              colSpan={4}
                              className="p-8 text-center text-muted-foreground"
                            >
                              Nenhum registro encontrado.
                            </td>
                          </tr>
                        ) : (
                          filteredProcessedAppointments.map((request) => (
                            <tr
                              key={request.id}
                              className="border-b hover:bg-muted/20 transition-colors"
                            >
                              <td className="p-4">
                                <Badge variant="outline">{request.id}</Badge>
                              </td>
                              <td className="p-4">
                                <Badge
                                  variant={getStatusBadgeVariant(
                                    request.status
                                  )}
                                >
                                  <span className="flex items-center">
                                    {getStatusBadgeIcon(request.status)}
                                    {request.status}
                                  </span>
                                </Badge>
                              </td>
                              <td className="p-4">{request.order_id}</td>
                              <td className="p-4">{request.type_event}</td>
                              <td className="p-4">{request.mensagem}</td>
                              <td className="p-4">
                                {request.status === "Erro" && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleReprocess(request.id)}
                                  >
                                    <RotateCcw className="h-4 w-4 mr-1" />
                                    Reprocessar
                                  </Button>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards */}
                  <div
                    className={`lg:hidden space-y-4 p-4 ${
                      requestsLoading ? "opacity-50" : ""
                    }`}
                  >
                    {filteredProcessedAppointments.map((request) => (
                      <Card key={request.id} className="shadow-sm">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <Badge variant="outline">{request.id}</Badge>
                            <Badge
                              variant={getStatusBadgeVariant(request.status)}
                            >
                              {request.status}
                            </Badge>
                          </div>

                          <div className="space-y-2">
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">
                                  Pedido:
                                </span>
                                <span className="text-sm">
                                  {request.order_id}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">
                                  Tipo:
                                </span>
                                <span className="text-sm">
                                  {request.type_event}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">
                                  Mensagem:
                                </span>
                                <span className="text-sm">
                                  {request.mensagem}
                                </span>
                              </div>
                            </div>

                            {request.status === "Erro" && (
                              <div className="mt-3">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleReprocess(request.id)}
                                  className="w-full"
                                >
                                  <RotateCcw className="h-4 w-4 mr-1" />
                                  Reprocessar
                                </Button>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Modal de Processamento */}
        <Dialog
          open={processAppointmentModal.isOpen}
          onOpenChange={(open) => {
            if (!open) {
            }
            setProcessAppointmentModal((prev) => ({ ...prev, isOpen: open }));
          }}
        >
          <DialogContent className="animate-scale-in">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-success" />
                Confirmar
              </DialogTitle>
              <DialogDescription>
                {processAppointmentModal.type === "single" ? (
                  <>
                    Confirmar Processamento{" "}
                    <strong>{processAppointmentModal.appointment?.id}</strong>?
                  </>
                ) : (
                  <>
                    Você está prestes a processar{" "}
                    <strong>
                      {processAppointmentModal.selectedCount} agendamentos
                    </strong>
                    .
                  </>
                )}
              </DialogDescription>
            </DialogHeader>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setProcessAppointmentModal((prev) => ({
                    ...prev,
                    isOpen: false,
                  }));
                }}
              >
                Cancelar
              </Button>
              <Button
                variant="payment"
                onClick={confirmProcessAppointment}
                disabled={processAppointmentLoading}
              >
                {processAppointmentLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Confirmar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal de Reprocessamento */}
        <Dialog
          open={reprocessModal.isOpen}
          onOpenChange={(open) => {
            setReprocessModal((prev) => ({ ...prev, isOpen: open }));
          }}
        >
          <DialogContent className="animate-scale-in">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <RotateCcw className="h-5 w-5 text-primary" />
                Deseja reprocessar?
              </DialogTitle>
              <DialogDescription>
                Essa ação tentará reprocessar o item selecionado.
              </DialogDescription>
            </DialogHeader>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setReprocessModal({ isOpen: false })}
              >
                Cancelar
              </Button>
              <Button
                variant="payment"
                onClick={confirmReprocess}
                disabled={reprocessingLoading}
              >
                {reprocessingLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RotateCcw className="h-4 w-4 mr-2" />
                )}
                Confirmar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
};

export default Appointments;

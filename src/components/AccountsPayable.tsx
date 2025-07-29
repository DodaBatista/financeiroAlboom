import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, CheckCircle, Clock, CreditCard, RefreshCw, RotateCcw, Search } from 'lucide-react';
import { useEffect, useState } from 'react';

const API_BASE_URL = 'https://fluxo.riapp.app/webhook/finance';

interface PayableTitle {
  id: string;
  memo: string;
  add_date: string;
  due_date: string;
  amount: string;
  customer_name: string;
  customer_lastname: string;
  document_number?: string;
  document_type_name?: string;
  order_id?: string;
  user_name: string;
  user_avatar: string;
}

interface Freelancer {
  id: string;
  name: string;
  lastname: string;
  email: string;
}

interface Bank {
  id: string;
  name: string;
  account_code: string;
  active: string;
}

interface PaymentRequest {
  id: string;
  title_id: string;
  details: string;
  status: 'Processado' | 'Em processamento' | 'Erro';
}

const AccountsPayable = () => {
  const { toast } = useToast();
  const [titles, setTitles] = useState<PayableTitle[]>([]);
  const [freelancers, setFreelancers] = useState<Freelancer[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  
  // Filtros
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedFreelancer, setSelectedFreelancer] = useState('');
  const [freelancerSearch, setFreelancerSearch] = useState('');

  // Seleção e paginação
  const [selectedTitles, setSelectedTitles] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [totalTitles, setTotalTitles] = useState(0);
  
  const [filteredTitles, setFilteredTitles] = useState<PayableTitle[]>([]);
  const [loading, setLoading] = useState(false);

  // Tab state
  const [activeTab, setActiveTab] = useState('titles');

  // Payment requests filters
  const [selectedStatus, setSelectedStatus] = useState('default');

  // Modais
  const [paymentModal, setPaymentModal] = useState<{
    isOpen: boolean;
    type: 'single' | 'multiple';
    title?: PayableTitle;
    selectedCount?: number;
  }>({ isOpen: false, type: 'single' });

  // Payment form state
  const [selectedBank, setSelectedBank] = useState(''); // No default selection
  const [paymentDate, setPaymentDate] = useState('');

  // API Functions
  const callAPI = async (endpoint: string, data: any = {}) => {
    try {
      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          endpoint,
          ...data
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API call failed for ${endpoint}:`, error);
      throw error;
    }
  };

  const fetchBanks = async () => {
    try {
      const response = await callAPI('banks/paginate');
      // Filter only active banks
      const activeBanks = (response || []).filter((bank: Bank) => bank.active === "1");
      setBanks(activeBanks);
    } catch (error) {
      toast({
        title: "Erro ao carregar bancos",
        description: "Não foi possível carregar a lista de bancos.",
        variant: "destructive"
      });
    }
  };

  const fetchFreelancers = async () => {
    try {
      const response = await callAPI('users/paginate');
      setFreelancers(response || []);
    } catch (error) {
      toast({
        title: "Erro ao carregar freelancers",
        description: "Não foi possível carregar a lista de freelancers.",
        variant: "destructive"
      });
    }
  };

  const fetchTitles = async () => {
    if (!startDate || !endDate) return;
    
    setLoading(true);
    try {
      const requestData: any = {
        pageNumber: currentPage,
        pageSize: itemsPerPage,
        start_date: startDate,
        end_date: endDate
      };

      // Only add customer_id if a specific freelancer is selected (not "all")
      if (selectedFreelancer && selectedFreelancer !== "all") {
        requestData.customer_id = selectedFreelancer;
      }

      const response = await callAPI('account_trans/paginate_apr', requestData);

      setTitles(response || []);
      setFilteredTitles(response || []);
      setTotalTitles(response?.length || 0);
    } catch (error) {
      toast({
        title: "Erro ao carregar títulos",
        description: "Não foi possível carregar a lista de títulos.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentRequests = async () => {
    try {
      const response = await callAPI('processados');
      setPaymentRequests(response || []);
    } catch (error) {
      toast({
        title: "Erro ao carregar baixas solicitadas",
        description: "Não foi possível carregar a lista de baixas solicitadas.",
        variant: "destructive"
      });
    }
  };

  // Inicializar datas padrão (primeiro e último dia do mês atual)
  useEffect(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    setStartDate(firstDay.toISOString().split('T')[0]);
    setEndDate(lastDay.toISOString().split('T')[0]);
  }, []);

  // Load initial data
  useEffect(() => {
    fetchBanks();
    fetchFreelancers();
  }, []);

  // Load titles when dates or filters change
  useEffect(() => {
    if (startDate && endDate) {
      fetchTitles();
    }
  }, [startDate, endDate, currentPage, itemsPerPage, selectedFreelancer]);

  // Load payment requests when tab changes
  useEffect(() => {
    if (activeTab === 'requests') {
      fetchPaymentRequests();
    }
  }, [activeTab]);


  // Filtros
  const filteredFreelancers = freelancers.filter(f => 
    `${f.name} ${f.lastname}`.toLowerCase().includes(freelancerSearch.toLowerCase())
  );

  // Paginação usando dados da API
  const totalPages = Math.ceil(totalTitles / itemsPerPage);
  const paginatedTitles = filteredTitles;

  const handleFilter = () => {
    setCurrentPage(1);
    setSelectedTitles(new Set()); // Clear selected titles when filtering
    fetchTitles(); // Fetch from API with current filters
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTitles(new Set(paginatedTitles.map(t => t.id)));
    } else {
      setSelectedTitles(new Set());
    }
  };

  const handleSelectTitle = (titleId: string, checked: boolean) => {
    const newSelected = new Set(selectedTitles);
    if (checked) {
      newSelected.add(titleId);
    } else {
      newSelected.delete(titleId);
    }
    setSelectedTitles(newSelected);
  };

  const handleSinglePayment = (title: PayableTitle) => {
    setPaymentModal({
      isOpen: true,
      type: 'single',
      title
    });
  };

  const handleMultiplePayment = () => {
    setPaymentModal({
      isOpen: true,
      type: 'multiple',
      selectedCount: selectedTitles.size
    });
  };

  const confirmPayment = async () => {
    // Validate required fields
    if (!selectedBank || !paymentDate) {
      toast({
        title: "Campos obrigatórios",
        description: "Selecione um banco e data de pagamento",
        variant: "destructive"
      });
      return;
    }

    // Prepare payload for API
    const titlesToProcess = paymentModal.type === 'single' 
      ? [paymentModal.title!] 
      : Array.from(selectedTitles).map(id => titles.find(t => t.id === id)!).filter(Boolean);

    const payload = titlesToProcess.map(title => ({
      id_titulo: title.id,
      dt_payment: paymentDate,
      account_code: selectedBank,
      memo: title.memo || ""
    }));

    try {
      await callAPI('account_trans/clear_apr', { payments: payload });
      
      if (paymentModal.type === 'single') {
        toast({
          title: "Baixa realizada",
          description: `Título ${paymentModal.title?.document_number || paymentModal.title?.id} pago com sucesso`,
        });
      } else {
        toast({
          title: "Baixas realizadas",
          description: `${paymentModal.selectedCount} títulos pagos com sucesso`,
        });
        setSelectedTitles(new Set());
      }

      // Reload titles list from API
      fetchTitles();
      
    } catch (error) {
      toast({
        title: "Erro no processamento",
        description: "Não foi possível processar o pagamento. Tente novamente.",
        variant: "destructive"
      });
    }
    
    // Reset form and close modal
    setSelectedBank('');
    setPaymentDate('');
    setPaymentModal({ isOpen: false, type: 'single' });
  };

  // Payment requests functions
  const handleRefresh = () => {
    fetchPaymentRequests();
    toast({
      title: "Dados atualizados",
      description: "Lista de baixas solicitadas foi recarregada",
    });
  };

  const handleReprocess = async (requestId: string) => {
    try {
      // Send reprocess request to API
      await callAPI('reprocess', { requestId });
      
      toast({
        title: "Reprocessamento bem-sucedido",
        description: "A baixa foi reprocessada com sucesso",
      });
      
      // Auto-refresh the table
      fetchPaymentRequests();
      
    } catch (error) {
      toast({
        title: "Erro no reprocessamento",
        description: "Não foi possível reprocessar a baixa. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  // Filter payment requests
  const filteredPaymentRequests = selectedStatus === 'default' || !selectedStatus
  ? paymentRequests
  : paymentRequests.filter(request => request.status === selectedStatus); 

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'Processado': return 'success';
      case 'Em processamento': return 'secondary';
      case 'Erro': return 'destructive';
      default: return 'outline';
    }
  };

  const getStatusBadgeIcon = (status: string) => {
  switch (status) {
    case 'Processado': return <CheckCircle className="w-3 h-3 mr-1" />;
    case 'Em processamento': return <Clock className="w-3 h-3 mr-1" />;
    case 'Erro': return <AlertCircle className="w-3 h-3 mr-1" />;
    default: return null;
  }
}

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const isFilterDisabled = !startDate || !endDate;

  const selectedTotal = Array.from(selectedTitles)
  .map(id => titles.find(t => t.id === id)?.amount || "0")
  .reduce((acc, val) => acc + parseFloat(val), 0);

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background p-4 md:p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
              Contas a Pagar
            </h1>
            <p className="text-muted-foreground">Sistema de gestão de títulos a pagar</p>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="titles">Títulos a Pagar</TabsTrigger>
              <TabsTrigger value="requests">Baixas Solicitadas</TabsTrigger>
            </TabsList>

            {/* Tab 1: Títulos a Pagar */}
            <TabsContent value="titles" className="space-y-6">
              {/* Filtros */}
              <Card className="shadow-card animate-fade-in">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="h-5 w-5 text-primary" />
                    Filtros
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Data Inicial *</label>
                      <Input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        required
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Data Final *</label>
                      <Input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        required
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Freelancer</label>
                      <Select value={selectedFreelancer} onValueChange={setSelectedFreelancer}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um freelancer" />
                        </SelectTrigger>
                        <SelectContent>
                          <div className="p-2">
                            <Input
                              placeholder="Pesquisar freelancer..."
                              value={freelancerSearch}
                              onChange={(e) => setFreelancerSearch(e.target.value)}
                              className="mb-2"
                            />
                          </div>
                          <SelectItem value="all">Todos os freelancers</SelectItem>
                          {filteredFreelancers.map(freelancer => (
                            <SelectItem key={freelancer.id} value={freelancer.id}>
                              {freelancer.name} {freelancer.lastname}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-end gap-2">
                      <Button 
                        onClick={handleFilter}
                        disabled={isFilterDisabled}
                        className="flex-1"
                        variant="default"
                      >
                        <Search className="h-4 w-4 mr-2" />
                        Filtrar
                      </Button>
                      
                      <Button 
                        variant="payment"
                        onClick={handleMultiplePayment}
                        disabled={selectedTitles.size === 0}
                        className="flex-1"
                      >
                        <CreditCard className="h-4 w-4 mr-2" />
                        Baixar ({selectedTitles.size})
                      </Button>

                    </div>
                  </div>
                </CardContent>
              </Card>

        <div className="px-4 text-sm text-muted-foreground">
          Total dos títulos selecionados: <span className="text-green-600 font-semibold">{formatCurrency(selectedTotal)}</span>
        </div>

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
                              checked={selectedTitles.size === paginatedTitles.length && paginatedTitles.length > 0}
                              onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                            />
                          </th>
                          <th className="p-4 text-left text-sm font-medium">Emissão</th>
                          <th className="p-4 text-left text-sm font-medium">Vencimento</th>
                          <th className="p-4 text-left text-sm font-medium">Doc</th>
                          <th className="p-4 text-left text-sm font-medium">Tipo</th>
                          <th className="p-4 text-left text-sm font-medium">Pedido</th>
                          <th className="p-4 text-left text-sm font-medium">Freelancer</th>
                          <th className="p-4 text-left text-sm font-medium">Observações</th>
                          <th className="p-4 text-left text-sm font-medium">Usuário</th>
                          <th className="p-4 text-left text-sm font-medium">Valor</th>
                          <th className="p-4 text-left text-sm font-medium">Ação</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedTitles.map((title) => (
                          <tr key={title.id} className="border-b hover:bg-muted/20 transition-colors">
                            <td className="p-4">
                              <Checkbox
                                checked={selectedTitles.has(title.id)}
                                onCheckedChange={(checked) => handleSelectTitle(title.id, checked as boolean)}
                              />
                            </td>
                            <td className="p-4 text-sm">{formatDate(title.add_date)}</td>
                            <td className="p-4 text-sm">{formatDate(title.due_date)}</td>
                            <td className="p-4">
                              <Badge variant="outline">{title.document_number || title.id}</Badge>
                            </td>
                            <td className="p-4 text-sm">{title.document_type_name || '-'}</td>
                            <td className="p-4 text-sm font-mono">{title.order_id || '-'}</td>
                            <td className="p-4 text-sm font-medium">
                              {title.customer_name} {title.customer_lastname || ''}
                            </td>
                            <td className="p-4 max-w-48">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="text-sm truncate text-left">
                                    {title.memo}
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-sm">
                                  <p>{title.memo}</p>
                                </TooltipContent>
                              </Tooltip>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={title.user_avatar} />
                                  <AvatarFallback>{title.user_name?.[0] || 'U'}</AvatarFallback>
                                </Avatar>
                                <span className="text-sm">{title.user_name}</span>
                              </div>
                            </td>
                            <td className="p-4">
                              <span className="font-semibold text-success">
                                {formatCurrency(parseFloat(title.amount))}
                              </span>
                            </td>
                            <td className="p-4">
                              <Button
                                variant="payment"
                                size="sm"
                                onClick={() => handleSinglePayment(title)}
                              >
                                <CreditCard className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="lg:hidden space-y-4 p-4">
                    {paginatedTitles.map((title) => (
                      <Card key={title.id} className="shadow-sm">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <Checkbox
                                checked={selectedTitles.has(title.id)}
                                onCheckedChange={(checked) => handleSelectTitle(title.id, checked as boolean)}
                              />
                              <Badge variant="outline">{title.document_number || title.id}</Badge>
                            </div>
                            <Button
                              variant="payment"
                              size="sm"
                              onClick={() => handleSinglePayment(title)}
                              disabled={parseFloat(title.amount) <= 0}
                            >
                              <CreditCard className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Freelancer:</span>
                              <span className="text-sm font-medium">
                                {title.customer_name} {title.customer_lastname || ''}
                              </span>
                            </div>
                            
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Valor:</span>
                              <span className="text-sm font-semibold text-success">
                                {formatCurrency(parseFloat(title.amount))}
                              </span>
                            </div>

                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Vencimento:</span>
                              <span className="text-sm">{formatDate(title.due_date)}</span>
                            </div>

                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Tipo:</span>
                              <span className="text-sm">{title.document_type_name || '-'}</span>
                            </div>

                            <div className="flex items-center gap-2 mt-3">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={title.user_avatar} />
                                <AvatarFallback className="text-xs">{title.user_name?.[0] || 'U'}</AvatarFallback>
                              </Avatar>
                              <span className="text-xs text-muted-foreground">{title.user_name}</span>
                            </div>

                            {title.memo && (
                              <div className="mt-2 p-2 bg-muted/50 rounded text-xs">
                                {title.memo}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Paginação */}
              <Card className="shadow-card">
                <CardContent className="py-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground">
                        Página {currentPage} de {totalPages} ({totalTitles} títulos)
                      </span>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Itens por página:</span>
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
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1 || loading}
                      >
                        Anterior
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages || loading}
                      >
                        Próxima
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab 2: Baixas Solicitadas */}
            <TabsContent value="requests" className="space-y-6">
              {/* Filtros para Baixas Solicitadas */}
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
                      <label className="text-sm font-medium mb-2 block">Status</label>
                      <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                        <SelectTrigger>
                          <SelectValue placeholder="Todos os status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="default">Todos os status</SelectItem>
                          <SelectItem value="Processado">Processado</SelectItem>
                          <SelectItem value="Em processamento">Em processamento</SelectItem>
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

              {/* Tabela de Baixas Solicitadas */}
              <Card className="shadow-financial animate-fade-in">
                <CardContent className="p-0">
                  {/* Desktop Table */}
                  <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted/50 border-b">
                        <tr>
                          <th className="p-4 text-left text-sm font-medium">ID do Título</th>
                          <th className="p-4 text-left text-sm font-medium">Detalhes</th>
                          <th className="p-4 text-left text-sm font-medium">Status</th>
                          <th className="p-4 text-left text-sm font-medium">Ação</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPaymentRequests.map((request) => (
                          <tr key={request.id} className="border-b hover:bg-muted/20 transition-colors">
                            <td className="p-4">
                              <Badge variant="outline">{request.title_id}</Badge>
                            </td>
                            <td className="p-4 text-sm max-w-xs">
                              <div className="truncate">{request.details}</div>
                            </td>
                            <td className="p-4">
                              
                              <Badge variant={getStatusBadgeVariant(request.status)}>
                                <span className="flex items-center">
                                  {getStatusBadgeIcon(request.status)}
                                  {request.status}
                                </span>
                              </Badge>
                            </td>
                            <td className="p-4">
                              {request.status === 'Erro' && (
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
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="lg:hidden space-y-4 p-4">
                    {filteredPaymentRequests.map((request) => (
                      <Card key={request.id} className="shadow-sm">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <Badge variant="outline">{request.title_id}</Badge>
                            <Badge variant={getStatusBadgeVariant(request.status)}>
                              {request.status}
                            </Badge>
                          </div>

                          <div className="space-y-2">
                            <div>
                              <span className="text-sm text-muted-foreground">Detalhes:</span>
                              <div className="text-sm mt-1">{request.details}</div>
                            </div>
                            
                            {request.status === 'Erro' && (
                              <div className="mt-3">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleReprocess(request.id)}
                                  className="w-full"
                                >
                                  <RotateCcw className="h-4 w-4 mr-1" />
                                  Reprocessar Baixa
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

        {/* Modal de Baixa */}
        <Dialog open={paymentModal.isOpen} onOpenChange={(open) => {
          if (!open) {
            setSelectedBank('');
            setPaymentDate('');
          }
          setPaymentModal(prev => ({ ...prev, isOpen: open }))
        }}>
          <DialogContent className="animate-scale-in">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-success" />
                {paymentModal.selectedCount > 1 ? "Confirmar Baixas" : "Confirmar Baixa" }
              </DialogTitle>
              <DialogDescription>
                {paymentModal.type === 'single' ? (
                  <>
                     Confirmar baixa do título <strong>{paymentModal.title?.document_number || paymentModal.title?.id}</strong> de{' '}
                     <strong>{paymentModal.title?.customer_name} {paymentModal.title?.customer_lastname || ''}</strong>?
                     <div className="mt-2 p-3 bg-muted/50 rounded">
                       <div className="text-sm text-muted-foreground mb-1">Total:</div>
                       <div className="text-lg font-semibold text-success">
                         {paymentModal.title && formatCurrency(parseFloat(paymentModal.title.amount))}
                       </div>
                     </div>
                  </>
                ) : (
                 <>
                  Você está prestes a dar baixa em <strong>{paymentModal.selectedCount} títulos</strong>.
                  <div className="mt-2 p-3 bg-muted/50 rounded">
                    <div className="text-sm text-muted-foreground mb-1">Total:</div>
                    <div className="text-lg font-semibold text-success">
                      {formatCurrency(selectedTotal)}
                    </div>
                  </div>
                </>
                )}
              </DialogDescription>
            </DialogHeader>
            
            {/* Payment Form Fields */}
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Banco *</label>
                <Select value={selectedBank} onValueChange={setSelectedBank}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um banco" />
                  </SelectTrigger>
                  <SelectContent>
                    {banks.map(bank => (
                       <SelectItem key={bank.id} value={bank.account_code}>
                         {bank.name}
                       </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Data de Pagamento *</label>
                <Input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSelectedBank('');
                  setPaymentDate('');
                  setPaymentModal(prev => ({ ...prev, isOpen: false }));
                }}
              >
                Cancelar
              </Button>
              <Button 
                variant="payment" 
                onClick={confirmPayment}
                disabled={!selectedBank || !paymentDate}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Confirmar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
};

export default AccountsPayable;
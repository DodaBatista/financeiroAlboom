import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, CheckCircle, Clock, CreditCard, Download, Loader2, RefreshCw, RotateCcw, Search, X, ChevronUp, ChevronDown } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useDebounce } from 'use-debounce';

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

interface Contact {
  id: string;
  name: string;
  lastname: string;
  email: string;
  company?: string;
}

interface PaymentType {
  id: string;
  name: string;
}

interface Bank {
  id: string;
  name: string;
  account_code: string;
  active: string;
}

interface PaymentRequest {
  id_titulo: string;
  dt_payment: string;
  account_code: string;
  memo: string;
  status: 'Sucesso' | 'Processando' | 'Erro';
  created_at: string;
}

const AccountsPayable = () => {
  const { toast } = useToast();
  const [titles, setTitles] = useState<PayableTitle[]>([]);
  const [freelancers, setFreelancers] = useState<Freelancer[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [paymentTypes, setPaymentTypes] = useState<PaymentType[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  
  // Filtros
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterType, setFilterType] = useState<'supplier' | 'freelancer'>('supplier');
  const [selectedFreelancer, setSelectedFreelancer] = useState('');
  const [selectedContact, setSelectedContact] = useState('');
  const [selectedPaymentType, setSelectedPaymentType] = useState('');
  const [freelancerSearch, setFreelancerSearch] = useState('');
  const [contactSearch, setContactSearch] = useState('');
  const [debouncedFreelancerSearch] = useDebounce(freelancerSearch, 500);
  const [debouncedContactSearch] = useDebounce(contactSearch, 500);
  const [freelancerLoading, setFreelancerLoading] = useState(false);
  const [contactLoading, setContactLoading] = useState(false);
  const [reprocessingLoading, setReprocessingLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  
  // Sorting state
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'ASC' | 'DESC';
  } | null>(null);

  // Ref para os campos de pesquisa
  const freelancerSearchRef = useRef<HTMLInputElement>(null);
  const contactSearchRef = useRef<HTMLInputElement>(null);

  // Seleção e paginação
  const [selectedTitles, setSelectedTitles] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(100);
  const [totalTitles, setTotalTitles] = useState(0);
  
  const [filteredTitles, setFilteredTitles] = useState<PayableTitle[]>([]);
  const [loading, setLoading] = useState(false);
  const [requestsLoading, setRequestsLoading] = useState(false);

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
  
  const [reprocessModal, setReprocessModal] = useState<{
    isOpen: boolean;
    titleId?: string;
  }>({ isOpen: false });

  // Estado para pesquisa de banco no modal
  const [bankSearch, setBankSearch] = useState('');
  const [hasFetchedInitialList, setHasFetchedInitialList] = useState(false);

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
          empresa: 'produtora7',
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

  const fetchFreelancers = async (searchTerm?: string) => {
    if (!searchTerm || searchTerm.length < 2) {
      setFreelancers([]);
      return;
    }
    
    setFreelancerLoading(true);
    try {
      const response = await callAPI('users/paginate', { searchTerm });
      setFreelancers(response || []);
    } catch (error) {
      toast({
        title: "Erro ao carregar freelancers",
        description: "Não foi possível carregar a lista de freelancers.",
        variant: "destructive"
      });
    } finally {
      setFreelancerLoading(false);
    }
  };

  const fetchContacts = async (searchTerm?: string) => {
    if (!searchTerm || searchTerm.length < 2) {
      setContacts([]);
      return;
    }
    
    setContactLoading(true);
    try {
      const response = await callAPI('contacts/paginate', { searchTerm });
      setContacts(response || []);
    } catch (error) {
      toast({
        title: "Erro ao carregar fornecedores",
        description: "Não foi possível carregar a lista de fornecedores.",
        variant: "destructive"
      });
    } finally {
      setContactLoading(false);
    }
  };

  const fetchPaymentTypes = async () => {
    try {
      const response = await callAPI('categories/payments');
      setPaymentTypes(response || []);
    } catch (error) {
      toast({
        title: "Erro ao carregar tipos de pagamento",
        description: "Não foi possível carregar a lista de tipos de pagamento.",
        variant: "destructive"
      });
    }
  };

  const fetchTitles = async () => {
    if (!startDate || !endDate) return;
    
    // Limpar tabela imediatamente
    setTitles([]);
    setFilteredTitles([]);
    
    setLoading(true);
    try {
      const requestData: any = {
        pageNumber: currentPage,
        pageSize: itemsPerPage,
        start_date: startDate,
        end_date: endDate
      };

      // Add customer_id based on filter type and selection
      if (filterType === 'freelancer' && selectedFreelancer) {
        requestData.customer_id = selectedFreelancer;
      } else if (filterType === 'supplier' && selectedContact) {
        requestData.customer_id = selectedContact;
      }

      // Add payment type filter if selected and not "all"
      if (selectedPaymentType && selectedPaymentType !== 'all') {
        requestData.doc_type = selectedPaymentType;
      }

      // Add sorting parameters
      if (sortConfig) {
        requestData.sortBy = sortConfig.key;
        requestData.sortDir = sortConfig.direction;
      }

      const response = await callAPI('account_trans/paginate_apr', requestData);

      // Nova estrutura da API: [{ titulos: [...], count: "45" }]
      const data = response?.[0];
      const titulos = data?.titulos || [];
      const totalCount = parseInt(data?.count || '0', 10); // Converter string para número

      setTitles(titulos);
      setFilteredTitles(titulos);
      setTotalTitles(totalCount); // Usar o count para paginação
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
    setRequestsLoading(true);
    try {
      const response = await callAPI('processados');
      setPaymentRequests(response || []);
    } catch (error) {
      toast({
        title: "Erro ao carregar baixas solicitadas",
        description: "Não foi possível carregar a lista de baixas solicitadas.",
        variant: "destructive"
      });
    } finally {
      setRequestsLoading(false);
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

  // Carregar títulos automaticamente na primeira renderização
  useEffect(() => {
    if (!hasFetchedInitialList && startDate && endDate) {
      fetchTitles();
      setHasFetchedInitialList(true);
    }
  }, [startDate, endDate]);

  // Load initial data
  useEffect(() => {
    fetchBanks();
    fetchPaymentTypes();
  }, []);

  // Debounced searches
  useEffect(() => {
    fetchFreelancers(debouncedFreelancerSearch);
  }, [debouncedFreelancerSearch]);

  useEffect(() => {
    fetchContacts(debouncedContactSearch);
  }, [debouncedContactSearch]);

  // Load titles when page or items per page change
  useEffect(() => {
    if (startDate && endDate) {
      fetchTitles();
    }
  }, [currentPage, itemsPerPage]);

  // Load payment requests when tab changes
  useEffect(() => {
    if (activeTab === 'requests') {
      fetchPaymentRequests();
    }
  }, [activeTab]);

  // Manter foco nos campos de pesquisa após atualização das listas
  useEffect(() => {
    if (freelancers.length > 0 && !freelancerLoading && freelancerSearch.length >= 2) {
      setTimeout(() => {
        freelancerSearchRef.current?.focus();
      }, 10);
    }
  }, [freelancers, freelancerLoading, freelancerSearch]);

  useEffect(() => {
    if (contacts.length > 0 && !contactLoading && contactSearch.length >= 2) {
      setTimeout(() => {
        contactSearchRef.current?.focus();
      }, 10);
    }
  }, [contacts, contactLoading, contactSearch]);

  // Reset selections when filter type changes
  useEffect(() => {
    setSelectedFreelancer('');
    setSelectedContact('');
    setFreelancerSearch('');
    setContactSearch('');
    setFreelancers([]);
    setContacts([]);
  }, [filterType]);


  // Filtros
  const filteredFreelancers = freelancers.filter(f => 
    `${f.name} ${f.lastname}`.toLowerCase().includes(freelancerSearch.toLowerCase())
  );

  const filteredContacts = contacts.filter(c => 
    `${c.name} ${c.lastname || ''} ${c.company || ''}`.toLowerCase().includes(contactSearch.toLowerCase())
  );

  // Paginação usando dados da API
  const totalPages = Math.ceil(totalTitles / itemsPerPage);
  const paginatedTitles = filteredTitles;

  const handleFilter = () => {
    setCurrentPage(1);
    setSelectedTitles(new Set()); // Clear selected titles when filtering
    fetchTitles(); // Fetch from API with current filters
  };

  const handleSort = (columnKey: string) => {
    let direction: 'ASC' | 'DESC' | null = 'ASC';
    
    if (sortConfig && sortConfig.key === columnKey) {
      if (sortConfig.direction === 'ASC') {
        direction = 'DESC';
      } else {
        direction = null; // Remove sorting
      }
    }
    
    if (direction) {
      setSortConfig({ key: columnKey, direction });
    } else {
      setSortConfig(null);
    }
    
    setCurrentPage(1);
    setTimeout(() => fetchTitles(), 100); // Small delay to ensure state is updated
  };

  const getSortIcon = (columnKey: string) => {
    if (!sortConfig || sortConfig.key !== columnKey) {
      return null;
    }
    return sortConfig.direction === 'ASC' ? 
      <ChevronUp className="inline w-4 h-4 ml-1" /> : 
      <ChevronDown className="inline w-4 h-4 ml-1" />;
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

    setPaymentLoading(true);
    
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
      await callAPI('account_trans/clear_apr', { Titulo: payload });
      
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
    } finally {
      setPaymentLoading(false);
    }
    
    // Reset form and close modal
    setSelectedBank('');
    setPaymentDate('');
    setPaymentModal({ isOpen: false, type: 'single' });
  };

  // Payment requests functions
  const handleRefresh = () => {
    fetchPaymentRequests();
  };

  const handleReprocess = (titleId: string) => {
    setReprocessModal({ isOpen: true, titleId });
  };

  const confirmReprocess = async () => {
    if (!reprocessModal.titleId) return;

    setReprocessingLoading(true);
    try {
      // Find the payment request data
      const request = paymentRequests.find(req => req.id_titulo === reprocessModal.titleId);
      if (!request) {
        toast({
          title: "Erro",
          description: "Dados do título não encontrados",
          variant: "destructive"
        });
        return;
      }

      // Send to the same endpoint as payment clearing with array format
      const payload = [{
        id_titulo: request.id_titulo,
        account_code: request.account_code,
        dt_payment: request.dt_payment,
        memo: request.memo
      }];

      await callAPI('account_trans/clear_apr', { Titulo: payload });
      
      toast({
        title: "Reprocessamento bem-sucedido",
        description: "A baixa foi reprocessada com sucesso",
        variant: "default",
        className: "bg-green-50 border-green-200 text-green-800"
      });
      
      // Auto-refresh the table
      fetchPaymentRequests();
      
    } catch (error) {
      toast({
        title: "Erro no reprocessamento",
        description: "Não foi possível reprocessar a baixa. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setReprocessingLoading(false);
    }
    
    setReprocessModal({ isOpen: false });
  };

  // Filter payment requests
  const filteredPaymentRequests = selectedStatus === 'default' || !selectedStatus
  ? paymentRequests
  : paymentRequests.filter(request => request.status === selectedStatus); 

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'Sucesso': return 'success';
      case 'Processado': return 'success'; // Legacy support
      case 'Processando': return 'secondary';
      case 'Erro': return 'destructive';
      default: return 'outline';
    }
  };

  const getStatusBadgeIcon = (status: string) => {
  switch (status) {
    case 'Sucesso': return <CheckCircle className="w-3 h-3 mr-1" />;
    case 'Processado': return <CheckCircle className="w-3 h-3 mr-1" />; // Legacy support
    case 'Processando': return <Clock className="w-3 h-3 mr-1" />;
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
    // Split the date string to avoid timezone issues
    const [year, month, day] = date.split('-');
    const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return dateObj.toLocaleDateString('pt-BR');
  };

  const isFilterDisabled = !startDate || !endDate;

  const selectedTotal = Array.from(selectedTitles)
  .map(id => titles.find(t => t.id === id)?.amount || "0")
  .reduce((acc, val) => acc + parseFloat(val), 0);

  // Filtrar bancos localmente com base na pesquisa
  const filteredBanks = banks.filter(bank =>
    bank.name.toLowerCase().includes(bankSearch.toLowerCase())
  );

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background p-4 md:p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-foreground">Contas a Pagar</h1>
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
                  <div className="space-y-4">
                    {/* Linha 1: Filtros principais */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                        <label className="text-sm font-medium mb-2 block">Tipo de Pagamento</label>
                        <Select value={selectedPaymentType} onValueChange={setSelectedPaymentType}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                          <SelectContent className="z-50 max-h-[300px] overflow-y-auto bg-popover">
                            <SelectItem value="all">Todos os tipos</SelectItem>
                            {paymentTypes.map(type => (
                              <SelectItem key={type.id} value={type.id}>
                                {type.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                    </div>

                    {/* Linha 2 e 3: Entidade, seleção e ações */}
                    {/* Mobile: layout empilhado */}
                    <div className="block md:hidden space-y-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Tipo de Entidade</label>
                        <RadioGroup 
                          value={filterType} 
                          onValueChange={(value: 'supplier' | 'freelancer') => setFilterType(value)}
                          className="flex flex-row gap-6 mt-2"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="supplier" id="supplier-mobile" />
                            <Label htmlFor="supplier-mobile" className="text-sm cursor-pointer">Fornecedor</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="freelancer" id="freelancer-mobile" />
                            <Label htmlFor="freelancer-mobile" className="text-sm cursor-pointer">Freelancer</Label>
                          </div>
                        </RadioGroup>
                      </div>

                      {/* Select de Fornecedor - Mobile */}
                      {filterType === 'supplier' && (
                        <div>
                          <label className="text-sm font-medium mb-2 block">Fornecedor</label>
                          <div className="flex items-center gap-2">
                            <Select 
                              value={selectedContact} 
                              onValueChange={(value) => setSelectedContact(value)}
                            >
                            <SelectTrigger data-contact-trigger="true" className="flex-1">
                              <SelectValue placeholder="Selecione um fornecedor" />
                            </SelectTrigger>
                            <SelectContent 
                              autoFocus={false}
                              className="z-50 max-h-[300px] overflow-y-auto bg-popover"
                              position="popper"
                              sideOffset={5}
                            >
                              <div className="p-2 sticky top-0 bg-popover border-b z-10">
                                <Input
                                  ref={contactSearchRef}
                                  placeholder="Digite ao menos 2 caracteres..."
                                  value={contactSearch}
                                  onChange={(e) => setContactSearch(e.target.value)}
                                  className="w-full"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    e.stopPropagation();
                                    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                                      e.preventDefault();
                                    }
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </div>
                              
                              {contactLoading ? (
                                <div className="flex items-center justify-center p-4">
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                </div>
                              ) : contacts.length > 0 ? (
                                contacts.map(contact => (
                                  <SelectItem 
                                    key={contact.id} 
                                    value={contact.id}
                                    className="max-w-full truncate"
                                  >
                                    <span className="truncate">
                                      {contact.name} {contact.lastname} {contact.company && `- ${contact.company}`}
                                    </span>
                                  </SelectItem>
                                ))
                              ) : contactSearch.length >= 2 ? (
                                <div className="p-4 text-center text-muted-foreground text-sm">
                                  Nenhum fornecedor encontrado
                                </div>
                              ) : (
                                <div className="p-4 text-center text-muted-foreground text-sm">
                                  Digite ao menos 2 caracteres para pesquisar
                                </div>
                              )}
                            </SelectContent>
                          </Select>
                          
                          {selectedContact && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedContact('');
                                setContactSearch('');
                              }}
                              className="h-10 w-10 p-0 flex-shrink-0"
                              title="Limpar seleção"
                            >
                              <X className="h-4 w-4" />
                             </Button>
                           )}
                          </div>
                        </div>
                      )}

                      {/* Select de Freelancer - Mobile */}
                      {filterType === 'freelancer' && (
                        <div>
                          <label className="text-sm font-medium mb-2 block">Freelancer</label>
                          <div className="flex items-center gap-2">
                          <Select 
                            value={selectedFreelancer} 
                            onValueChange={(value) => setSelectedFreelancer(value)}
                          >
                            <SelectTrigger data-freelancer-trigger="true" className="flex-1">
                              <SelectValue placeholder="Selecione um freelancer" />
                            </SelectTrigger>
                            <SelectContent 
                              autoFocus={false}
                              className="z-50 max-h-[300px] overflow-y-auto bg-popover"
                              position="popper"
                              sideOffset={5}
                            >
                              <div className="p-2 sticky top-0 bg-popover border-b z-10">
                                <Input
                                  ref={freelancerSearchRef}
                                  placeholder="Digite ao menos 2 caracteres..."
                                  value={freelancerSearch}
                                  onChange={(e) => setFreelancerSearch(e.target.value)}
                                  className="w-full"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    e.stopPropagation();
                                    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                                      e.preventDefault();
                                    }
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </div>
                              
                              {freelancerLoading ? (
                                <div className="flex items-center justify-center p-4">
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                </div>
                              ) : freelancers.length > 0 ? (
                                freelancers.map(freelancer => (
                                  <SelectItem 
                                    key={freelancer.id} 
                                    value={freelancer.id}
                                    className="max-w-full truncate"
                                  >
                                    <span className="truncate">{freelancer.name} {freelancer.lastname}</span>
                                  </SelectItem>
                                ))
                              ) : freelancerSearch.length >= 2 ? (
                                <div className="p-4 text-center text-muted-foreground text-sm">
                                  Nenhum freelancer encontrado
                                </div>
                              ) : (
                                <div className="p-4 text-center text-muted-foreground text-sm">
                                  Digite ao menos 2 caracteres para pesquisar
                                </div>
                              )}
                            </SelectContent>
                          </Select>
                          
                          {selectedFreelancer && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedFreelancer('');
                                setFreelancerSearch('');
                              }}
                              className="h-10 w-10 p-0 flex-shrink-0"
                              title="Limpar seleção"
                            >
                              <X className="h-4 w-4" />
                             </Button>
                           )}
                          </div>
                        </div>
                      )}

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
                          onClick={handleMultiplePayment}
                          disabled={selectedTitles.size === 0}
                          className="w-full"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Baixar selecionados ({selectedTitles.size})
                        </Button>
                      </div>
                    </div>

                    {/* Desktop: layout em linha única */}
                    <div className="hidden md:flex items-end gap-4">
                      {/* Lado esquerdo: Radio buttons */}
                      <div className="flex items-center gap-6">
                        <RadioGroup 
                          value={filterType} 
                          onValueChange={(value: 'supplier' | 'freelancer') => setFilterType(value)}
                          className="flex flex-row gap-6"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="supplier" id="supplier-desktop" />
                            <Label htmlFor="supplier-desktop" className="text-sm cursor-pointer">Fornecedor</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="freelancer" id="freelancer-desktop" />
                            <Label htmlFor="freelancer-desktop" className="text-sm cursor-pointer">Freelancer</Label>
                          </div>
                        </RadioGroup>
                      </div>

                      {/* Centro: Select expandido */}
                      <div className="flex-1 mx-4">
                        {filterType === 'supplier' && (
                          <div>
                            <label className="text-sm font-medium mb-2 block">Fornecedor</label>
                            <div className="flex items-center gap-2">
                              <Select
                              value={selectedContact} 
                              onValueChange={(value) => setSelectedContact(value)}
                            >
                              <SelectTrigger data-contact-trigger="true" className="flex-1">
                                <SelectValue placeholder="Selecione um fornecedor" />
                              </SelectTrigger>
                              <SelectContent 
                                autoFocus={false}
                                className="z-50 max-h-[300px] overflow-y-auto bg-popover"
                                position="popper"
                                sideOffset={5}
                              >
                                <div className="p-2 sticky top-0 bg-popover border-b z-10">
                                  <Input
                                    placeholder="Digite ao menos 2 caracteres..."
                                    value={contactSearch}
                                    onChange={(e) => setContactSearch(e.target.value)}
                                    className="w-full"
                                    autoFocus
                                    onKeyDown={(e) => {
                                      e.stopPropagation();
                                      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                                        e.preventDefault();
                                      }
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </div>
                                
                                {contactLoading ? (
                                  <div className="flex items-center justify-center p-4">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  </div>
                                ) : contacts.length > 0 ? (
                                  contacts.map(contact => (
                                    <SelectItem 
                                      key={contact.id} 
                                      value={contact.id}
                                      className="max-w-full truncate"
                                    >
                                      <span className="truncate">
                                        {contact.name} {contact.lastname} {contact.company && `- ${contact.company}`}
                                      </span>
                                    </SelectItem>
                                  ))
                                ) : contactSearch.length >= 2 ? (
                                  <div className="p-4 text-center text-muted-foreground text-sm">
                                    Nenhum fornecedor encontrado
                                  </div>
                                ) : (
                                  <div className="p-4 text-center text-muted-foreground text-sm">
                                    Digite ao menos 2 caracteres para pesquisar
                                  </div>
                                )}
                              </SelectContent>
                            </Select>
                            
                            {selectedContact && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedContact('');
                                  setContactSearch('');
                                }}
                                className="h-10 w-10 p-0 flex-shrink-0"
                                title="Limpar seleção"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                             )}
                            </div>
                          </div>
                        )}

                        {filterType === 'freelancer' && (
                          <div>
                            <label className="text-sm font-medium mb-2 block">Freelancer</label>
                            <div className="flex items-center gap-2">
                              <Select
                              value={selectedFreelancer} 
                              onValueChange={(value) => setSelectedFreelancer(value)}
                            >
                              <SelectTrigger data-freelancer-trigger="true" className="flex-1">
                                <SelectValue placeholder="Selecione um freelancer" />
                              </SelectTrigger>
                              <SelectContent 
                                autoFocus={false}
                                className="z-50 max-h-[300px] overflow-y-auto bg-popover"
                                position="popper"
                                sideOffset={5}
                              >
                                <div className="p-2 sticky top-0 bg-popover border-b z-10">
                                  <Input
                                    placeholder="Digite ao menos 2 caracteres..."
                                    value={freelancerSearch}
                                    onChange={(e) => setFreelancerSearch(e.target.value)}
                                    className="w-full"
                                    autoFocus
                                    onKeyDown={(e) => {
                                      e.stopPropagation();
                                      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                                        e.preventDefault();
                                      }
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </div>
                                
                                {freelancerLoading ? (
                                  <div className="flex items-center justify-center p-4">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  </div>
                                ) : freelancers.length > 0 ? (
                                  freelancers.map(freelancer => (
                                    <SelectItem 
                                      key={freelancer.id} 
                                      value={freelancer.id}
                                      className="max-w-full truncate"
                                    >
                                      <span className="truncate">{freelancer.name} {freelancer.lastname}</span>
                                    </SelectItem>
                                  ))
                                ) : freelancerSearch.length >= 2 ? (
                                  <div className="p-4 text-center text-muted-foreground text-sm">
                                    Nenhum freelancer encontrado
                                  </div>
                                ) : (
                                  <div className="p-4 text-center text-muted-foreground text-sm">
                                    Digite ao menos 2 caracteres para pesquisar
                                  </div>
                                )}
                              </SelectContent>
                            </Select>
                            
                            {selectedFreelancer && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedFreelancer('');
                                  setFreelancerSearch('');
                                }}
                                className="h-10 w-10 p-0 flex-shrink-0"
                                title="Limpar seleção"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                             )}
                            </div>
                          </div>
                        )}
                      </div>

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
                          onClick={handleMultiplePayment}
                          disabled={selectedTitles.size === 0}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Baixar ({selectedTitles.size})
                        </Button>
                      </div>
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
                                disabled={loading}
                              />
                            </th>
                            <th className="p-4 text-left text-sm font-medium cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => handleSort('add_date')}>
                              Emissão {getSortIcon('add_date')}
                            </th>
                            <th className="p-4 text-left text-sm font-medium cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => handleSort('due_date')}>
                              Vencimento {getSortIcon('due_date')}
                            </th>
                            <th className="p-4 text-left text-sm font-medium cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => handleSort('document_number')}>
                              Doc {getSortIcon('document_number')}
                            </th>
                            <th className="p-4 text-left text-sm font-medium cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => handleSort('document_type_name')}>
                              Tipo {getSortIcon('document_type_name')}
                            </th>
                            <th className="p-4 text-left text-sm font-medium cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => handleSort('order_id')}>
                              Pedido {getSortIcon('order_id')}
                            </th>
                            <th className="p-4 text-left text-sm font-medium cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => handleSort('customer_name')}>
                              Fornecedor/Freelancer {getSortIcon('customer_name')}
                            </th>
                            <th className="p-4 text-left text-sm font-medium cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => handleSort('memo')}>
                              Observações {getSortIcon('memo')}
                            </th>
                            <th className="p-4 text-left text-sm font-medium cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => handleSort('user_name')}>
                              Usuário {getSortIcon('user_name')}
                            </th>
                            <th className="p-4 text-left text-sm font-medium cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => handleSort('amount')}>
                              Valor {getSortIcon('amount')}
                            </th>
                            <th className="p-4 text-left text-sm font-medium">Ação</th>
                          </tr>
                        </thead>
                        <tbody>
                          {loading ? (
                            <tr>
                              <td colSpan={11} className="p-8 text-center">
                                <div className="flex items-center justify-center">
                                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                                  <span>Carregando títulos...</span>
                                </div>
                              </td>
                            </tr>
                          ) : (() => {
                            const validTitles = paginatedTitles.filter(title => title.id && title.amount && !isNaN(parseFloat(title.amount)));
                            if (validTitles.length === 0) {
                              return (
                                <tr>
                                  <td colSpan={11} className="p-8 text-center text-muted-foreground">
                                    Nenhum título encontrado com os filtros selecionados.
                                  </td>
                                </tr>
                              );
                            }
                            return validTitles.map((title) => (
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
                          ));
                         })()}
                        </tbody>
                    </table>
                  </div>

                   {/* Mobile Cards */}
                   <div className={`lg:hidden space-y-4 p-4 ${loading ? 'opacity-50' : ''}`}>
                     {(() => {
                       const validTitles = paginatedTitles.filter(title => title.id && title.amount && !isNaN(parseFloat(title.amount)));
                       if (validTitles.length === 0 && !loading) {
                         return (
                           <div className="text-center p-8 text-muted-foreground">
                             Nenhum título encontrado com os filtros selecionados.
                           </div>
                         );
                       }
                       return validTitles.map((title) => (
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
                              <span className="text-sm text-muted-foreground">Fornecedor/Freelancer:</span>
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
                          <SelectItem value="Sucesso">Sucesso</SelectItem>
                          <SelectItem value="Processando">Processando</SelectItem>
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
                  {requestsLoading && (
                    <div className="flex items-center justify-center p-8">
                      <Loader2 className="h-6 w-6 animate-spin mr-2" />
                      <span>Carregando baixas solicitadas...</span>
                    </div>
                  )}
                  {/* Desktop Table */}
                  <div className={`hidden lg:block overflow-x-auto ${requestsLoading ? 'opacity-50' : ''}`}>
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
                          {filteredPaymentRequests.length === 0 && !requestsLoading ? (
                            <tr>
                              <td colSpan={4} className="p-8 text-center text-muted-foreground">
                                Nenhum registro encontrado.
                              </td>
                            </tr>
                          ) : (
                            filteredPaymentRequests.map((request) => (
                           <tr key={request.id_titulo} className="border-b hover:bg-muted/20 transition-colors">
                             <td className="p-4">
                               <Badge variant="outline">{request.id_titulo}</Badge>
                             </td>
                             <td className="p-4 text-sm max-w-xs">
                               <div className="space-y-1">
                                 <div className="font-medium">{request.memo}</div>
                                 <div className="text-muted-foreground">Conta: {request.account_code}</div>
                                 <div className="text-muted-foreground">Data: {formatDate(request.dt_payment)}</div>
                               </div>
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
                                   onClick={() => handleReprocess(request.id_titulo)}
                                 >
                                   <RotateCcw className="h-4 w-4 mr-1" />
                                   Reprocessar
                                 </Button>
                               )}
                             </td>
                           </tr>
                          )))}
                       </tbody>
                    </table>
                  </div>

                   {/* Mobile Cards */}
                    <div className={`lg:hidden space-y-4 p-4 ${requestsLoading ? 'opacity-50' : ''}`}>
                     {filteredPaymentRequests.map((request) => (
                       <Card key={request.id_titulo} className="shadow-sm">
                         <CardContent className="p-4">
                           <div className="flex items-start justify-between mb-3">
                             <Badge variant="outline">{request.id_titulo}</Badge>
                             <Badge variant={getStatusBadgeVariant(request.status)}>
                               {request.status}
                             </Badge>
                           </div>

                           <div className="space-y-2">
                             <div>
                               <span className="text-sm text-muted-foreground">Detalhes:</span>
                               <div className="text-sm mt-1 space-y-1">
                                 <div className="font-medium">{request.memo}</div>
                                 <div className="text-muted-foreground">Conta: {request.account_code}</div>
                                 <div className="text-muted-foreground">Data: {formatDate(request.dt_payment)}</div>
                               </div>
                             </div>
                             
                             {request.status === 'Erro' && (
                               <div className="mt-3">
                                 <Button
                                   variant="outline"
                                   size="sm"
                                   onClick={() => handleReprocess(request.id_titulo)}
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
            setBankSearch(''); // Limpar pesquisa do banco ao fechar modal
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
                  <SelectContent autoFocus={false}>
                    <div className="p-2 sticky top-0 bg-popover border-b">
                      <Input
                        placeholder="Digite para pesquisar..."
                        value={bankSearch}
                        onChange={(e) => setBankSearch(e.target.value)}
                        className="w-full"
                        autoFocus
                        onKeyDown={(e) => {
                          e.stopPropagation();
                          // Prevent arrow keys from navigating to list items
                          if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                            e.preventDefault();
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    
                    {filteredBanks.length > 0 ? (
                      filteredBanks.map(bank => (
                        <SelectItem key={bank.id} value={bank.account_code}>
                          {bank.name}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-4 text-center text-muted-foreground text-sm">
                        Nenhum banco encontrado
                      </div>
                    )}
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
                disabled={!selectedBank || !paymentDate || paymentLoading}
              >
                {paymentLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CreditCard className="h-4 w-4 mr-2" />
                )}
                Confirmar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal de Reprocessamento */}
        <Dialog open={reprocessModal.isOpen} onOpenChange={(open) => {
          setReprocessModal(prev => ({ ...prev, isOpen: open }))
        }}>
          <DialogContent className="animate-scale-in">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <RotateCcw className="h-5 w-5 text-primary" />
                Deseja reprocessar esta baixa?
              </DialogTitle>
              <DialogDescription>
                Essa ação tentará reprocessar a baixa do título selecionado.
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

export default AccountsPayable;
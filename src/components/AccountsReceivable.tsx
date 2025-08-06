import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, CheckCircle, Clock, CreditCard, Download, Loader2, RefreshCw, RotateCcw, Search, X, ChevronUp, ChevronDown } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useDebounce } from 'use-debounce';

const API_BASE_URL = 'https://fluxo.riapp.app/webhook/finance';

interface ReceivableTitle {
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

interface Customer {
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

interface ApiResponse<T> {
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

interface SortConfig {
  field: string | null;
  direction: 'ASC' | 'DESC' | null;
}

const AccountsReceivable = () => {
  const [receivableTitles, setReceivableTitles] = useState<ReceivableTitle[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [paymentTypes, setPaymentTypes] = useState<PaymentType[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm] = useDebounce(searchTerm, 500);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [selectedPaymentType, setSelectedPaymentType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedTitles, setSelectedTitles] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: null, direction: null });
  const { toast } = useToast();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleSort = (field: string) => {
    setSortConfig(prev => {
      if (prev.field === field) {
        if (prev.direction === 'ASC') {
          return { field, direction: 'DESC' };
        } else if (prev.direction === 'DESC') {
          return { field: null, direction: null };
        }
      }
      return { field, direction: 'ASC' };
    });
    setCurrentPage(1);
  };

  const getSortIcon = (field: string) => {
    if (sortConfig.field !== field) return null;
    return sortConfig.direction === 'ASC' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
  };

  const fetchPaymentTypes = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/payment-types`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: 'payment-types',
          empresa: 'produtora7'
        })
      });
      
      if (!response.ok) throw new Error('Erro ao buscar tipos de pagamento');
      
      const data = await response.json();
      setPaymentTypes(data.data || []);
    } catch (error) {
      console.error('Erro ao buscar tipos de pagamento:', error);
    }
  };

  const fetchCustomers = async (search: string) => {
    if (!search.trim()) {
      setCustomers([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: 'contacts',
          searchTerm: search,
          empresa: 'produtora7'
        })
      });
      
      if (!response.ok) throw new Error('Erro ao buscar clientes');
      
      const data = await response.json();
      setCustomers(data.data || []);
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
      toast({
        title: "Erro ao buscar clientes",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchReceivableTitles = async (page = 1) => {
    setLoading(true);
    try {
      const payload: any = {
        endpoint: 'receivable-titles',
        page,
        limit: itemsPerPage,
        empresa: 'produtora7'
      };

      if (selectedCustomer) payload.customer_id = selectedCustomer;
      if (selectedPaymentType) payload.payment_type_id = selectedPaymentType;
      if (startDate) payload.start_date = startDate;
      if (endDate) payload.end_date = endDate;
      if (sortConfig.field && sortConfig.direction) {
        payload.sortBy = sortConfig.field;
        payload.sortDir = sortConfig.direction;
      }

      const response = await fetch(`${API_BASE_URL}/receivable-titles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) throw new Error('Erro ao buscar títulos a receber');
      
      const data: ApiResponse<ReceivableTitle> = await response.json();
      setReceivableTitles(data.data || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalItems(data.pagination?.totalItems || 0);
    } catch (error) {
      console.error('Erro ao buscar títulos a receber:', error);
      toast({
        title: "Erro ao buscar títulos a receber",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentTypes();
  }, []);

  useEffect(() => {
    fetchCustomers(debouncedSearchTerm);
  }, [debouncedSearchTerm]);

  useEffect(() => {
    fetchReceivableTitles(currentPage);
  }, [currentPage, itemsPerPage, sortConfig]);

  const handleFilter = () => {
    setCurrentPage(1);
    fetchReceivableTitles(1);
  };

  const handleReset = () => {
    setSearchTerm('');
    setSelectedCustomer('');
    setSelectedPaymentType('');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
    setSortConfig({ field: null, direction: null });
    setCustomers([]);
    fetchReceivableTitles(1);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTitles(receivableTitles.map(title => title.id));
    } else {
      setSelectedTitles([]);
    }
  };

  const handleSelectTitle = (titleId: string, checked: boolean) => {
    if (checked) {
      setSelectedTitles(prev => [...prev, titleId]);
    } else {
      setSelectedTitles(prev => prev.filter(id => id !== titleId));
    }
  };

  const handleDownloadSelected = () => {
    if (selectedTitles.length === 0) {
      toast({
        title: "Nenhum título selecionado",
        description: "Selecione pelo menos um título para baixar.",
        variant: "destructive",
      });
      return;
    }
    setDialogOpen(true);
  };

  const confirmDownload = () => {
    toast({
      title: "Download iniciado",
      description: `${selectedTitles.length} título(s) baixado(s) com sucesso.`,
    });
    setSelectedTitles([]);
    setDialogOpen(false);
  };

  const formatCurrency = (value: string) => {
    const numValue = parseFloat(value);
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(numValue);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  const getStatusColor = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'bg-destructive text-destructive-foreground';
    if (diffDays <= 5) return 'bg-yellow-500 text-yellow-50';
    return 'bg-success text-success-foreground';
  };

  const getStatusText = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'Vencido';
    if (diffDays === 0) return 'Vence hoje';
    if (diffDays <= 5) return `${diffDays} dias`;
    return 'No prazo';
  };

  const renderPagination = () => {
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <Button
          key={i}
          variant={i === currentPage ? "default" : "outline"}
          size="sm"
          onClick={() => setCurrentPage(i)}
        >
          {i}
        </Button>
      );
    }

    return pages;
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Contas a Receber</h1>
                <p className="text-muted-foreground mt-1">
                  Gerencie seus títulos a receber e acompanhe pagamentos
                </p>
              </div>
              <Button 
                onClick={() => fetchReceivableTitles(currentPage)} 
                variant="outline"
                className="self-end sm:self-auto"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar
              </Button>
            </div>

            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5 text-primary" />
                  Filtros de Pesquisa
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Primeira linha: filtros principais */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="start-date">Data Inicial</Label>
                      <Input
                        id="start-date"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="end-date">Data Final</Label>
                      <Input
                        id="end-date"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="payment-type">Tipo de Pagamento</Label>
                      <Select value={selectedPaymentType} onValueChange={setSelectedPaymentType}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Todos os tipos</SelectItem>
                          {paymentTypes.map((type) => (
                            <SelectItem key={type.id} value={type.id}>
                              {type.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Segunda linha: cliente */}
                  <div className="space-y-2">
                    <Label htmlFor="customer-search">Clientes</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="customer-search"
                        ref={searchInputRef}
                        type="text"
                        placeholder="Digite o nome do cliente..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    {customers.length > 0 && (
                      <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o cliente" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Todos os clientes</SelectItem>
                          {customers.map((customer) => (
                            <SelectItem key={customer.id} value={customer.id}>
                              {customer.name} {customer.lastname}
                              {customer.company && ` - ${customer.company}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  {/* Terceira linha: ações */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button onClick={handleFilter} className="shadow-button">
                      <Search className="h-4 w-4 mr-2" />
                      Filtrar
                    </Button>
                    <Button variant="outline" onClick={handleReset}>
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Limpar Filtros
                    </Button>
                    <Button 
                      variant="secondary" 
                      onClick={handleDownloadSelected}
                      disabled={selectedTitles.length === 0}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Baixar Selecionados ({selectedTitles.length})
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-primary" />
                    Títulos a Receber
                  </span>
                  {totalItems > 0 && (
                    <span className="text-sm text-muted-foreground">
                      {totalItems} registro(s) encontrado(s)
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="ml-2 text-muted-foreground">Carregando...</span>
                  </div>
                ) : receivableTitles.length > 0 ? (
                  <div className="space-y-4">
                    <div className="hidden lg:block overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left p-3">
                              <Checkbox
                                checked={selectedTitles.length === receivableTitles.length}
                                onCheckedChange={handleSelectAll}
                              />
                            </th>
                            <th 
                              className="text-left p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                              onClick={() => handleSort('memo')}
                            >
                              <div className="flex items-center gap-2">
                                Descrição
                                {getSortIcon('memo')}
                              </div>
                            </th>
                            <th 
                              className="text-left p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                              onClick={() => handleSort('customer_name')}
                            >
                              <div className="flex items-center gap-2">
                                Cliente
                                {getSortIcon('customer_name')}
                              </div>
                            </th>
                            <th 
                              className="text-left p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                              onClick={() => handleSort('amount')}
                            >
                              <div className="flex items-center gap-2">
                                Valor
                                {getSortIcon('amount')}
                              </div>
                            </th>
                            <th 
                              className="text-left p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                              onClick={() => handleSort('add_date')}
                            >
                              <div className="flex items-center gap-2">
                                Data Adição
                                {getSortIcon('add_date')}
                              </div>
                            </th>
                            <th 
                              className="text-left p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                              onClick={() => handleSort('due_date')}
                            >
                              <div className="flex items-center gap-2">
                                Vencimento
                                {getSortIcon('due_date')}
                              </div>
                            </th>
                            <th className="text-left p-3">Status</th>
                            <th className="text-left p-3">Responsável</th>
                          </tr>
                        </thead>
                        <tbody>
                          {receivableTitles.map((title) => (
                            <tr key={title.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                              <td className="p-3">
                                <Checkbox
                                  checked={selectedTitles.includes(title.id)}
                                  onCheckedChange={(checked) => handleSelectTitle(title.id, checked as boolean)}
                                />
                              </td>
                              <td className="p-3">
                                <div>
                                  <p className="font-medium text-foreground">{title.memo}</p>
                                  {title.document_number && (
                                    <p className="text-sm text-muted-foreground">
                                      {title.document_type_name}: {title.document_number}
                                    </p>
                                  )}
                                </div>
                              </td>
                              <td className="p-3">
                                <p className="font-medium text-foreground">
                                  {title.customer_name} {title.customer_lastname}
                                </p>
                              </td>
                              <td className="p-3">
                                <p className="font-semibold text-lg text-primary">
                                  {formatCurrency(title.amount)}
                                </p>
                              </td>
                              <td className="p-3">
                                <p className="text-foreground">{formatDate(title.add_date)}</p>
                              </td>
                              <td className="p-3">
                                <p className="text-foreground">{formatDate(title.due_date)}</p>
                              </td>
                              <td className="p-3">
                                <Badge className={getStatusColor(title.due_date)}>
                                  {getStatusText(title.due_date)}
                                </Badge>
                              </td>
                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-8 w-8">
                                    <AvatarImage src={title.user_avatar} alt={title.user_name} />
                                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                                      {title.user_name.split(' ').map(n => n[0]).join('')}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-sm text-foreground">{title.user_name}</span>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Cards para mobile */}
                    <div className="lg:hidden space-y-4">
                      {receivableTitles.map((title) => (
                        <Card key={title.id} className="p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between mb-3">
                            <Checkbox
                              checked={selectedTitles.includes(title.id)}
                              onCheckedChange={(checked) => handleSelectTitle(title.id, checked as boolean)}
                            />
                            <Badge className={getStatusColor(title.due_date)}>
                              {getStatusText(title.due_date)}
                            </Badge>
                          </div>
                          <div className="space-y-2">
                            <p className="font-medium text-foreground">{title.memo}</p>
                            <p className="text-sm text-muted-foreground">
                              Cliente: {title.customer_name} {title.customer_lastname}
                            </p>
                            <p className="text-lg font-semibold text-primary">
                              {formatCurrency(title.amount)}
                            </p>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <span className="text-muted-foreground">Adição:</span>
                                <p>{formatDate(title.add_date)}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Vencimento:</span>
                                <p>{formatDate(title.due_date)}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 pt-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={title.user_avatar} alt={title.user_name} />
                                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                                  {title.user_name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-xs text-muted-foreground">{title.user_name}</span>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>

                    {/* Paginação */}
                    {totalPages > 1 && (
                      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Itens por página:</span>
                          <Select 
                            value={itemsPerPage.toString()} 
                            onValueChange={(value) => {
                              setItemsPerPage(parseInt(value));
                              setCurrentPage(1);
                            }}
                          >
                            <SelectTrigger className="w-20">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="10">10</SelectItem>
                              <SelectItem value="25">25</SelectItem>
                              <SelectItem value="50">50</SelectItem>
                              <SelectItem value="100">100</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(1)}
                            disabled={currentPage === 1}
                          >
                            Primeira
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(currentPage - 1)}
                            disabled={currentPage === 1}
                          >
                            Anterior
                          </Button>
                          {renderPagination()}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(currentPage + 1)}
                            disabled={currentPage === totalPages}
                          >
                            Próxima
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(totalPages)}
                            disabled={currentPage === totalPages}
                          >
                            Última
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">
                      Nenhum título encontrado
                    </h3>
                    <p className="text-muted-foreground">
                      Ajuste os filtros ou adicione novos títulos a receber.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Dialog de confirmação de download */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar Download</DialogTitle>
              <DialogDescription>
                Você está prestes a baixar {selectedTitles.length} título(s) selecionado(s).
                Deseja continuar?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={confirmDownload}>
                Confirmar Download
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
};

export default AccountsReceivable;

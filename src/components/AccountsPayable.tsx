import React, { useState, useEffect } from 'react';
import { Calendar, Search, CreditCard, Eye, Users, DollarSign, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface PayableTitle {
  id: string;
  emission_date: string;
  due_date: string;
  document: string;
  type: string;
  order: string;
  freelancer_name: string;
  observations: string;
  user_name: string;
  user_avatar: string;
  amount: number;
  status: 'pending' | 'paid';
}

interface Freelancer {
  id: string;
  name: string;
}

const AccountsPayable = () => {
  const { toast } = useToast();
  const [titles, setTitles] = useState<PayableTitle[]>([]);
  const [freelancers] = useState<Freelancer[]>([
    { id: '1', name: 'João Silva' },
    { id: '2', name: 'Maria Santos' },
    { id: '3', name: 'Pedro Costa' },
    { id: '4', name: 'Ana Oliveira' },
  ]);
  
  // Filtros
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedFreelancer, setSelectedFreelancer] = useState('');
  const [freelancerSearch, setFreelancerSearch] = useState('');

  // Seleção e paginação
  const [selectedTitles, setSelectedTitles] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(15);

  // Modais
  const [paymentModal, setPaymentModal] = useState<{
    isOpen: boolean;
    type: 'single' | 'multiple';
    title?: PayableTitle;
    selectedCount?: number;
  }>({ isOpen: false, type: 'single' });

  // Inicializar datas padrão (primeiro e último dia do mês atual)
  useEffect(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    setStartDate(firstDay.toISOString().split('T')[0]);
    setEndDate(lastDay.toISOString().split('T')[0]);
  }, []);

  // Mock data - simular dados da API
  useEffect(() => {
    const mockTitles: PayableTitle[] = [
      {
        id: '1',
        emission_date: '2024-01-15',
        due_date: '2024-01-25',
        document: 'NF-001',
        type: 'Serviço',
        order: 'PED-2024-001',
        freelancer_name: 'João Silva',
        observations: 'Desenvolvimento de sistema de gestão financeira com interface responsiva e funcionalidades completas de relatórios',
        user_name: 'Admin',
        user_avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
        amount: 2500.00,
        status: 'pending'
      },
      {
        id: '2',
        emission_date: '2024-01-16',
        due_date: '2024-01-30',
        document: 'NF-002',
        type: 'Consultoria',
        order: 'PED-2024-002',
        freelancer_name: 'Maria Santos',
        observations: 'Consultoria em arquitetura de software',
        user_name: 'Gerente',
        user_avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=manager',
        amount: 1800.00,
        status: 'pending'
      },
      {
        id: '3',
        emission_date: '2024-01-17',
        due_date: '2024-02-01',
        document: 'NF-003',
        type: 'Design',
        order: 'PED-2024-003',
        freelancer_name: 'Pedro Costa',
        observations: 'Criação de identidade visual completa',
        user_name: 'Designer',
        user_avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=designer',
        amount: 3200.00,
        status: 'pending'
      },
      {
        id: '4',
        emission_date: '2024-01-18',
        due_date: '2024-02-05',
        document: 'NF-004',
        type: 'Marketing',
        order: 'PED-2024-004',
        freelancer_name: 'Ana Oliveira',
        observations: 'Campanha de marketing digital',
        user_name: 'Marketing',
        user_avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=marketing',
        amount: 1500.00,
        status: 'pending'
      }
    ];
    setTitles(mockTitles);
  }, []);

  // Filtros
  const filteredFreelancers = freelancers.filter(f => 
    f.name.toLowerCase().includes(freelancerSearch.toLowerCase())
  );

  const filteredTitles = titles.filter(title => {
    const titleDate = new Date(title.emission_date);
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const dateMatch = titleDate >= start && titleDate <= end;
    const freelancerMatch = !selectedFreelancer || selectedFreelancer === 'all' || title.freelancer_name === selectedFreelancer;
    
    return dateMatch && freelancerMatch;
  });

  // Paginação
  const totalPages = Math.ceil(filteredTitles.length / itemsPerPage);
  const paginatedTitles = filteredTitles.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Handlers
  const handleFilter = () => {
    setCurrentPage(1);
    toast({
      title: "Filtros aplicados",
      description: `${filteredTitles.length} títulos encontrados`,
    });
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

  const confirmPayment = () => {
    if (paymentModal.type === 'single') {
      toast({
        title: "Pagamento realizado",
        description: `Título ${paymentModal.title?.document} pago com sucesso`,
      });
    } else {
      toast({
        title: "Pagamentos realizados",
        description: `${paymentModal.selectedCount} títulos pagos com sucesso`,
      });
      setSelectedTitles(new Set());
    }
    setPaymentModal({ isOpen: false, type: 'single' });
  };

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
                        <SelectItem key={freelancer.id} value={freelancer.name}>
                          {freelancer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button 
                    onClick={handleFilter}
                    disabled={isFilterDisabled}
                    className="w-full"
                    variant="default"
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Filtrar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ações em massa */}
          {selectedTitles.size > 0 && (
            <Card className="shadow-card animate-slide-up bg-gradient-card">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {selectedTitles.size} título(s) selecionado(s)
                  </span>
                  <Button 
                    variant="payment" 
                    onClick={handleMultiplePayment}
                    className="animate-scale-in"
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Pagar Selecionados
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

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
                        <td className="p-4 text-sm">{formatDate(title.emission_date)}</td>
                        <td className="p-4 text-sm">{formatDate(title.due_date)}</td>
                        <td className="p-4">
                          <Badge variant="outline">{title.document}</Badge>
                        </td>
                        <td className="p-4 text-sm">{title.type}</td>
                        <td className="p-4 text-sm font-mono">{title.order}</td>
                        <td className="p-4 text-sm font-medium">{title.freelancer_name}</td>
                        <td className="p-4 max-w-48">
                          <Tooltip>
                            <TooltipTrigger>
                              <div className="text-sm truncate text-left">
                                {title.observations}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-sm">
                              <p>{title.observations}</p>
                            </TooltipContent>
                          </Tooltip>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={title.user_avatar} />
                              <AvatarFallback>{title.user_name[0]}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{title.user_name}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="font-semibold text-success">
                            {formatCurrency(title.amount)}
                          </span>
                        </td>
                        <td className="p-4">
                          <Button
                            variant="payment"
                            size="sm"
                            onClick={() => handleSinglePayment(title)}
                            disabled={title.amount <= 0}
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
                          <Badge variant="outline">{title.document}</Badge>
                        </div>
                        <Button
                          variant="payment"
                          size="sm"
                          onClick={() => handleSinglePayment(title)}
                          disabled={title.amount <= 0}
                        >
                          <CreditCard className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Freelancer:</span>
                          <span className="text-sm font-medium">{title.freelancer_name}</span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Valor:</span>
                          <span className="text-sm font-semibold text-success">
                            {formatCurrency(title.amount)}
                          </span>
                        </div>

                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Vencimento:</span>
                          <span className="text-sm">{formatDate(title.due_date)}</span>
                        </div>

                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Tipo:</span>
                          <span className="text-sm">{title.type}</span>
                        </div>

                        <div className="flex items-center gap-2 mt-3">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={title.user_avatar} />
                            <AvatarFallback className="text-xs">{title.user_name[0]}</AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-muted-foreground">{title.user_name}</span>
                        </div>

                        {title.observations && (
                          <div className="mt-2 p-2 bg-muted/50 rounded text-xs">
                            {title.observations}
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
          {totalPages > 1 && (
            <Card className="shadow-card">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Página {currentPage} de {totalPages} ({filteredTitles.length} títulos)
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Próxima
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Modal de Pagamento */}
        <Dialog open={paymentModal.isOpen} onOpenChange={(open) => setPaymentModal(prev => ({ ...prev, isOpen: open }))}>
          <DialogContent className="animate-scale-in">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-success" />
                Confirmar Pagamento
              </DialogTitle>
              <DialogDescription>
                {paymentModal.type === 'single' ? (
                  <>
                    Confirmar pagamento do título <strong>{paymentModal.title?.document}</strong> de{' '}
                    <strong>{paymentModal.title?.freelancer_name}</strong>?
                    <div className="mt-2 p-3 bg-muted/50 rounded">
                      <div className="text-lg font-semibold text-success">
                        {paymentModal.title && formatCurrency(paymentModal.title.amount)}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    Você está prestes a pagar <strong>{paymentModal.selectedCount} títulos</strong>. 
                    Deseja continuar?
                  </>
                )}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setPaymentModal(prev => ({ ...prev, isOpen: false }))}
              >
                Cancelar
              </Button>
              <Button variant="payment" onClick={confirmPayment}>
                <CreditCard className="h-4 w-4 mr-2" />
                Confirmar Pagamento
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
};

export default AccountsPayable;
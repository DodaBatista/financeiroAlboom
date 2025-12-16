import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import PaymentRequestForm from '@/components/PaymentRequestForm';
import {
  createPaymentRequest,
  fetchPaymentRequests,
  getPaymentRequest,
  updatePaymentRequest,
  deletePaymentRequest,
  PaymentRequestItem,
  PaymentRequestPayload,
} from '@/services/paymentRequestService';
import {
  createWhatsAppUser,
  updateWhatsAppUser,
  fetchWhatsAppUsers,
  WhatsAppUser,
} from '@/services/whatsappUserService';
import {
  createApprovalLink,
  updateApprovalLink,
  deleteApprovalLink,
  fetchApprovalLinks,
  ApprovalLink,
} from '@/services/approvalLinkService';
import { Loader2, Search, Plus, Edit2, Trash2, Eye, MoreVertical, Send, FileText, Users, Link, Check, ChevronsUpDown } from 'lucide-react';
import { callAPIN8N } from '@/utils/api';

// Tipos removidos - agora importados do service

const PaymentRequestsPage: React.FC = () => {
  const { toast } = useToast();
  
  // Estado da aba ativa
  const [activeTab, setActiveTab] = useState('requests');
  
  const [requests, setRequests] = useState<PaymentRequestItem[]>([]);
  const [allRequests, setAllRequests] = useState<PaymentRequestItem[]>([]); // Todos os registros do backend
  const [loading, setLoading] = useState(false);
  const [requestsLoading, setRequestsLoading] = useState(false);

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(100);
  const [total, setTotal] = useState(0);

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Modal state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [requestToDelete, setRequestToDelete] = useState<string | null>(null);
  const [sendToSystemModalOpen, setSendToSystemModalOpen] = useState(false);
  const [selectedRequestsForAction, setSelectedRequestsForAction] = useState<string[]>([]);

  const [activeRequest, setActiveRequest] = useState<PaymentRequestItem | null>(null);

  // Filter state
  interface FilterState {
    department: string;
    paymentCompany: string;
    paymentType: string;
    personType: 'all' | 'fisica' | 'juridica';
    approvedDepartment: string;
    approvedDirector: string;
    userId: string;
  }

  const [selectedFilters, setSelectedFilters] = useState<FilterState>({
    department: 'all',
    paymentCompany: 'all',
    paymentType: 'all',
    personType: 'all',
    approvedDepartment: 'all',
    approvedDirector: 'all',
    userId: 'all'
  });

  // Form state (reuse for create/edit)
  const { user } = useAuth();

  // Dados Gerais
  const [formRequester, setFormRequester] = useState('');
  const [formRequesterEmail, setFormRequesterEmail] = useState('');
  const [formDepartment, setFormDepartment] = useState('');
  const [formPaymentCompany, setFormPaymentCompany] = useState('');
  const [formClientName, setFormClientName] = useState('');
  const [formContractNumber, setFormContractNumber] = useState('');
  const [formReason, setFormReason] = useState('');
  const [formPaymentType, setFormPaymentType] = useState('Normal');
  const [formModality, setFormModality] = useState('Depósito');
  const [formExpenseValue, setFormExpenseValue] = useState('');
  const [formDueDate, setFormDueDate] = useState('');

  // Dados Bancários
  const [formPersonType, setFormPersonType] = useState<'fisica' | 'juridica'>('fisica');
  const [formTitular, setFormTitular] = useState('');
  const [formCpfCnpj, setFormCpfCnpj] = useState('');
  const [formBank, setFormBank] = useState('');
  const [formAgency, setFormAgency] = useState('');
  const [formAccount, setFormAccount] = useState('');
  const [formPixType, setFormPixType] = useState('E-mail');
  const [formPixKey, setFormPixKey] = useState('');

  const [formLoading, setFormLoading] = useState(false);

  // ===== Estados para Usuários WhatsApp =====
  const [whatsappUsers, setWhatsappUsers] = useState<WhatsAppUser[]>([]);
  const [allWhatsappUsers, setAllWhatsappUsers] = useState<WhatsAppUser[]>([]); // Todos os usuários do backend
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState('true'); // 'true', 'false', 'all'
  const [userCurrentPage, setUserCurrentPage] = useState(1);
  const [userItemsPerPage, setUserItemsPerPage] = useState(100);
  const [userTotal, setUserTotal] = useState(0);

  // Modal de usuário
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [userEditMode, setUserEditMode] = useState(false);
  const [activeUser, setActiveUser] = useState<WhatsAppUser | null>(null);

  // Form de usuário
  const [formUserName, setFormUserName] = useState('');
  const [formUserPhone, setFormUserPhone] = useState('');
  const [formUserEmail, setFormUserEmail] = useState('');
  const [formUserStatus, setFormUserStatus] = useState(true);
  const [userFormLoading, setUserFormLoading] = useState(false);

  // ===== Estados para Vínculos de Aprovação =====
  const [approvalLinks, setApprovalLinks] = useState<ApprovalLink[]>([]);
  const [allApprovalLinks, setAllApprovalLinks] = useState<ApprovalLink[]>([]); // Todos os vínculos do backend
  const [linksLoading, setLinksLoading] = useState(false);
  const [linkSearchTerm, setLinkSearchTerm] = useState('');
  const [linkCurrentPage, setLinkCurrentPage] = useState(1);
  const [linkItemsPerPage, setLinkItemsPerPage] = useState(100);
  const [linkTotal, setLinkTotal] = useState(0);

  // Modal de vínculo
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [linkEditMode, setLinkEditMode] = useState(false);
  const [activeLink, setActiveLink] = useState<ApprovalLink | null>(null);
  const [linkDeleteModalOpen, setLinkDeleteModalOpen] = useState(false);
  const [linkToDelete, setLinkToDelete] = useState<string | null>(null);

  // Form de vínculo
  const [formLinkUserId, setFormLinkUserId] = useState('');
  const [formLinkApproverDepartmentId, setFormLinkApproverDepartmentId] = useState('');
  const [formLinkApproverDirectorId, setFormLinkApproverDirectorId] = useState('');
  const [linkFormLoading, setLinkFormLoading] = useState(false);
  const [userComboOpen, setUserComboOpen] = useState(false);
  const [approverDeptComboOpen, setApproverDeptComboOpen] = useState(false);
  const [approverDirComboOpen, setApproverDirComboOpen] = useState(false);

  // Funções auxiliares para telefone e email
  const formatPhoneNumber = (value: string): string => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '');
    
    // Aplica a máscara (00) 00000-0000 ou (00) 0000-0000
    if (numbers.length <= 10) {
      return numbers
        .replace(/^(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4})(\d)/, '$1-$2');
    }
    return numbers
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .slice(0, 15); // Limita ao tamanho máximo: (00) 00000-0000
  };

  const cleanPhoneNumber = (value: string): string => {
    // Remove máscara e adiciona código do Brasil (55)
    const numbers = value.replace(/\D/g, '');
    return `55${numbers}`;
  };

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhoneNumber(value);
    setFormUserPhone(formatted);
  };

  // --- Helpers for masks / formatting ---
  const formatCpf = (value: string) => {
    const d = value.replace(/\D/g, '').slice(0, 11);
    if (!d) return '';
    if (d.length <= 3) return d;
    if (d.length <= 6) return `${d.slice(0,3)}.${d.slice(3)}`;
    if (d.length <= 9) return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6)}`;
    return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9,11)}`;
  };

  const formatCnpj = (value: string) => {
    const d = value.replace(/\D/g, '').slice(0, 14);
    if (!d) return '';
    if (d.length <= 2) return d;
    if (d.length <= 5) return `${d.slice(0,2)}.${d.slice(2)}`;
    if (d.length <= 8) return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5)}`;
    if (d.length <= 12) return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5,8)}/${d.slice(8)}`;
    return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5,8)}/${d.slice(8,12)}-${d.slice(12,14)}`;
  };

  const formatCpfCnpj = (value: string, type: 'fisica' | 'juridica') => {
    if (type === 'fisica') return formatCpf(value);
    return formatCnpj(value);
  };

  const formatCurrency = (value: string) => {
    // Remove tudo exceto números
    const digits = value.replace(/\D/g, '');
    // Converte para número dividido por 100 (move vírgula 2 casas)
    const amount = Number(digits) / 100;
    // Formata com Intl para garantir separador de milhares e 2 decimais
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Safe formatters to avoid crashes when API returns empty/null values
  const safeFormatCurrency = (value: any) => {
    if (value === null || value === undefined || value === '') return '-';
    
    let num: number;
    
    // Se for string, pode estar no formato "900,00" ou "900.00" ou "900"
    if (typeof value === 'string') {
      // Remove pontos de milhar e substitui vírgula por ponto
      const cleanValue = value.replace(/\./g, '').replace(',', '.');
      num = Number(cleanValue);
    } else {
      num = Number(value);
    }
    
    if (isNaN(num)) return '-';
    return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const safeFormatDate = (value?: any) => {
    if (!value) return '-';
    const d = new Date(value);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('pt-BR');
  };

  const safeFormatDateTime = (value?: any) => {
    if (!value) return '-';
    const d = new Date(value);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleString('pt-BR');
  };

  // Conversão de empresa de pagamento
  const companyDbToDisplay = (dbValue: string): string => {
    const mapping: Record<string, string> = {
      'Taj_Noivas': 'TAJ - Noivas',
      'Taj_Salão': 'TAJ - Salão',
      'Produtora_7': 'Estudio Produtora 7'
    };
    return mapping[dbValue] || dbValue;
  };

  const companyDisplayToDb = (displayValue: string): string => {
    const mapping: Record<string, string> = {
      'TAJ - Noivas': 'Taj_Noivas',
      'TAJ - Salão': 'Taj_Salão',
      'Estudio Produtora 7': 'Produtora_7'
    };
    return mapping[displayValue] || displayValue;
  };

  // Map approval values from API to label and badge variant
  type BadgeVariant = 'success' | 'destructive' | 'secondary' | 'default' | 'outline';
  const mapApproval = (val: any): { label: string; variant: BadgeVariant } => {
    if (val === 'APPROVED') return { label: 'Aprovado', variant: 'success' };
    if (val === 'REPROVED') return { label: 'Reprovado', variant: 'destructive' };
    if (val === 'PENDING') return { label: 'Pendente', variant: 'secondary' };
    // Fallback para qualquer outro valor (null, undefined, etc)
    return { label: 'Pendente', variant: 'secondary' };
  };

  // Reformat CPF/CNPJ display when person type changes
  useEffect(() => {
    setFormCpfCnpj((prev) => {
      const digits = prev.replace(/\D/g, '');
      return formatCpfCnpj(digits, formPersonType);
    });
  }, [formPersonType]);

  const loadRequests = async () => {
    setRequestsLoading(true);
    try {
      const filters = {
        start_date: startDate,
        end_date: endDate,
        department: selectedFilters.department,
        payment_company: selectedFilters.paymentCompany !== 'all' ? companyDisplayToDb(selectedFilters.paymentCompany) : selectedFilters.paymentCompany,
        payment_type: selectedFilters.paymentType,
        person_type: selectedFilters.personType,
        approved_department: selectedFilters.approvedDepartment,
        approved_director: selectedFilters.approvedDirector,
        id_user: selectedFilters.userId,
        page: currentPage,
        limit: itemsPerPage,
      };
      
      const res = await fetchPaymentRequests(filters);
      
      // Backend retorna: { data: [{ data: [...], pagination: {...} }], total: 1 }
      let responseData = res;
      
      // Se res.data for um array, pega o primeiro elemento
      if (responseData?.data && Array.isArray(responseData.data)) {
        responseData = responseData.data[0];
      }
      
      // Extrai os dados reais
      let data: any[] = responseData?.data || [];
      
      // Normalize response: some APIs return [{}] when no records exist — treat that as empty list
      if (Array.isArray(data) && data.length === 1 && Object.keys(data[0] || {}).length === 0) {
        data = [];
      }
      
      setAllRequests(data);
      applyFrontendFilters(data);
      
      // Usa totalItems da paginação ou length dos dados
      const totalItems = responseData?.pagination?.totalItems || data.length;
      setTotal(totalItems);
    } catch (error) {
      toast({ title: 'Erro', description: 'Não foi possível carregar solicitações', variant: 'destructive' });
    } finally {
      setRequestsLoading(false);
    }
  };

  // Filtro de busca no frontend - busca em todos os campos string
  const applyFrontendFilters = (data: PaymentRequestItem[]) => {
    if (!searchTerm.trim()) {
      setRequests(data);
      return;
    }

    const searchLower = searchTerm.toLowerCase().trim();
    const filtered = data.filter((item) => {
      // Busca em todos os campos string do objeto
      return (
        item.requester?.toLowerCase().includes(searchLower) ||
        item.requester_email?.toLowerCase().includes(searchLower) ||
        item.department?.toLowerCase().includes(searchLower) ||
        item.payment_company?.toLowerCase().includes(searchLower) ||
        item.client_name?.toLowerCase().includes(searchLower) ||
        String(item.contract_number || '').toLowerCase().includes(searchLower) ||
        item.reason?.toLowerCase().includes(searchLower) ||
        item.payment_type?.toLowerCase().includes(searchLower) ||
        item.modality?.toLowerCase().includes(searchLower) ||
        item.titular?.toLowerCase().includes(searchLower) ||
        item.cpf_cnpj?.toLowerCase().includes(searchLower) ||
        item.bank?.toLowerCase().includes(searchLower) ||
        item.pix_key?.toLowerCase().includes(searchLower)
      );
    });

    setRequests(filtered);
  };

  useEffect(() => {
    // default to current month
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    setStartDate(firstDay.toISOString().split('T')[0]);
    setEndDate(lastDay.toISOString().split('T')[0]);
  }, []);

  // Carregar dados iniciais após definir as datas
  useEffect(() => {
    if (startDate && endDate) {
      loadRequests();
    }
  }, [startDate, endDate]);

  // Recarregar quando mudar página ou itens por página
  useEffect(() => {
    if (startDate && endDate) {
      loadRequests();
    }
  }, [currentPage, itemsPerPage]);

  // Aplicar filtro de busca quando searchTerm mudar
  useEffect(() => {
    applyFrontendFilters(allRequests);
  }, [searchTerm]);

  // Carregar usuários WhatsApp quando a aba de requests for acessada (para usar no filtro)
  useEffect(() => {
    if (activeTab === 'requests' && allWhatsappUsers.length === 0) {
      loadWhatsAppUsers('true'); // Carregar apenas usuários ativos
    }
  }, [activeTab]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(requests.map((r) => r.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelect = (id: string, checked: boolean) => {
    const s = new Set(selectedIds);
    if (checked) s.add(id); else s.delete(id);
    setSelectedIds(s);
  };

  const openCreateModal = () => {
    // prefill requester
    setFormRequester(user?.name || '');
    setFormRequesterEmail(user?.email || '');
    setFormDepartment('');
    setFormPaymentCompany('');
    setFormClientName('');
    setFormContractNumber('');
    setFormReason('');
    setFormPaymentType('Normal');
    setFormModality('Depósito');
    setFormExpenseValue('');
    setFormDueDate('');

    setFormPersonType('fisica');
    setFormTitular('');
    setFormCpfCnpj('');
    setFormBank('');
    setFormAgency('');
    setFormAccount('');
    setFormPixType('E-mail');
    setFormPixKey('');
    
    setCreateModalOpen(true);
  };

  const openViewModal = async (id: string) => {
    setLoading(true);
    try {
      const data = await getPaymentRequest(id);
      setActiveRequest(data);
      setViewModalOpen(true);
    } catch (error) {
      toast({ title: 'Erro', description: 'Não foi possível obter a solicitação', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleView = (request: PaymentRequestItem) => {
    setActiveRequest(request);
    
    // Popular os campos do formulário
    setFormRequester(request.requester || user?.name || '');
    setFormRequesterEmail((request as any).requester_email || user?.email || '');
    setFormDepartment(request.department || '');
    setFormPaymentCompany(companyDbToDisplay(request.payment_company || ''));
    setFormClientName(request.client_name || '');
    setFormContractNumber(String(request.contract_number || ''));
    setFormReason(request.reason || '');
    setFormPaymentType(request.payment_type || 'Normal');
    setFormModality(request.modality || 'Depósito');
    setFormExpenseValue(String(request.expense_value || (request as any).amount || ''));
    setFormDueDate(request.due_date || '');

    setFormPersonType(request.person_type || 'fisica');
    setFormTitular(request.titular || '');
    setFormCpfCnpj(request.cpf_cnpj || '');
    setFormBank(request.bank || '');
    setFormAgency(request.agency || '');
    setFormAccount(request.account || '');
    setFormPixType(request.pix_type || 'E-mail');
    setFormPixKey(request.pix_key || '');
    
    setViewModalOpen(true);
  };

  const openEditModal = async (id: string) => {
    setLoading(true);
    try {
      const data = await getPaymentRequest(id);
  setActiveRequest(data);
  // map fields
  setFormRequester(data.requester || user?.name || '');
  setFormRequesterEmail((data as any).requester_email || (data as any).requester_email || user?.email || '');
  setFormDepartment(data.department || '');
  setFormPaymentCompany(companyDbToDisplay(data.payment_company || ''));
  setFormClientName(data.client_name || '');
  setFormContractNumber(String(data.contract_number || ''));
  setFormReason(data.reason || '');
  setFormPaymentType(data.payment_type || 'Normal');
  setFormModality(data.modality || 'Depósito');
  setFormExpenseValue(String(data.expense_value || data.amount || ''));
  setFormDueDate(data.due_date || '');

  setFormPersonType(data.person_type || 'fisica');
  setFormTitular(data.titular || '');
  setFormCpfCnpj(data.cpf_cnpj || '');
  setFormBank(data.bank || '');
  setFormAgency(data.agency || '');
  setFormAccount(data.account || '');
  setFormPixType(data.pix_type || 'E-mail');
  setFormPixKey(data.pix_key || '');
      setEditModalOpen(true);
    } catch (error) {
      toast({ title: 'Erro', description: 'Não foi possível obter a solicitação', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const openDeleteModal = (item: PaymentRequestItem) => {
    setActiveRequest(item);
    setDeleteModalOpen(true);
  };

  const handleFormChange = (field: keyof PaymentRequestPayload | 'requester_email', value: string) => {
    switch (field) {
      case 'requester_email':
        setFormRequesterEmail(value);
        break;
      case 'department':
        setFormDepartment(value);
        break;
      case 'payment_company':
        setFormPaymentCompany(value);
        break;
      case 'client_name':
        setFormClientName(value);
        break;
      case 'contract_number':
        setFormContractNumber(value);
        break;
      case 'reason':
        setFormReason(value);
        break;
      case 'payment_type':
        setFormPaymentType(value);
        break;
      case 'modality':
        setFormModality(value);
        break;
      case 'expense_value':
        setFormExpenseValue(value);
        break;
      case 'due_date':
        setFormDueDate(value);
        break;
      case 'person_type':
        setFormPersonType(value as 'fisica' | 'juridica');
        break;
      case 'titular':
        setFormTitular(value);
        break;
      case 'cpf_cnpj':
        setFormCpfCnpj(value);
        break;
      case 'bank':
        setFormBank(value);
        break;
      case 'agency':
        setFormAgency(value);
        break;
      case 'account':
        setFormAccount(value);
        break;
      case 'pix_type':
        setFormPixType(value);
        break;
      case 'pix_key':
        setFormPixKey(value);
        break;
    }
  };

  const handleCreate = async () => {
    setFormLoading(true);
    try {
      const payload: any = {
        requester: formRequester,
          requester_email: user?.email || '',
        department: formDepartment,
        payment_company: companyDisplayToDb(formPaymentCompany),
        client_name: formClientName,
        contract_number: formContractNumber,
        reason: formReason,
        payment_type: formPaymentType,
        modality: formModality,
        expense_value: Number(formExpenseValue.replace(/\D/g, '')) / 100,
        due_date: formDueDate,

        person_type: formPersonType,
        titular: formTitular,
        cpf_cnpj: formCpfCnpj.replace(/\D/g, ''),
        bank: formBank,
        agency: formAgency.replace(/\D/g, ''),
        account: formAccount.replace(/\D/g, ''),
      };

      // Adicionar campos PIX apenas se a modalidade for Pix
      if (formModality === 'Pix') {
        payload.pix_type = formPixType;
        payload.pix_key = formPixKey;
      } else {
        payload.pix_type = '';
        payload.pix_key = '';
      }

      await createPaymentRequest(payload);
      toast({ title: 'Criado', description: 'Solicitação criada com sucesso' });
      setCreateModalOpen(false);
      loadRequests();
    } catch (error) {
      toast({ title: 'Erro', description: (error as Error)?.message || 'Erro ao criar', variant: 'destructive' });
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!activeRequest) return;
    setFormLoading(true);
    try {
      const payload: any = {
        requester: formRequester,
        requester_email: user?.email || '',
        department: formDepartment,
        payment_company: companyDisplayToDb(formPaymentCompany),
        client_name: formClientName,
        contract_number: formContractNumber,
        reason: formReason,
        payment_type: formPaymentType,
        modality: formModality,
        expense_value: Number(formExpenseValue.replace(/\D/g, '')) / 100,
        due_date: formDueDate,

        person_type: formPersonType,
        titular: formTitular,
        cpf_cnpj: formCpfCnpj.replace(/\D/g, ''),
        bank: formBank,
        agency: formAgency.replace(/\D/g, ''),
        account: formAccount.replace(/\D/g, ''),
      };

      // Adicionar campos PIX apenas se a modalidade for Pix
      if (formModality === 'Pix') {
        payload.pix_type = formPixType;
        payload.pix_key = formPixKey;
      } else {
        payload.pix_type = '';
        payload.pix_key = '';
      }

      await updatePaymentRequest(activeRequest.id, payload);
      toast({ title: 'Atualizado', description: 'Solicitação atualizada com sucesso' });
      setViewModalOpen(false);
      loadRequests();
    } catch (error) {
      toast({ title: 'Erro', description: (error as Error)?.message || 'Erro ao atualizar', variant: 'destructive' });
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!activeRequest) return;
    setFormLoading(true);
    try {
      await deletePaymentRequest(activeRequest.id);
      toast({ title: 'Deletado', description: 'Solicitação removida' });
      setDeleteModalOpen(false);
      loadRequests();
    } catch (error) {
      toast({ title: 'Erro', description: (error as Error)?.message || 'Erro ao deletar', variant: 'destructive' });
    } finally {
      setFormLoading(false);
    }
  };

  const handleSendToSystem = async (id: string) => {
    setLoading(true);
    try {
      // TODO: Implementar chamada à API para enviar ao sistema
      // await sendPaymentRequestToSystem(id);
      toast({
        title: 'Enviado',
        description: 'Solicitação enviada para o sistema com sucesso',
      });
      loadRequests();
    } catch (error) {
      toast({
        title: 'Erro',
        description: (error as Error)?.message || 'Erro ao enviar para o sistema',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendToDirector = async (ids: string[]) => {
    setLoading(true);
    try {
      // Verificar se todas as solicitações têm aprovação de departamento
      const requestsToSend = requests.filter(r => ids.includes(r.id));
      const notApproved = requestsToSend.filter(r => r.approved_department !== 'APPROVED');
      
      if (notApproved.length > 0) {
        toast({
          title: 'Erro',
          description: 'Apenas solicitações com aprovação de departamento podem ser enviadas para o diretor.',
          variant: 'destructive',
        });
        return;
      }

      // Enviar solicitações para o diretor
      await callAPIN8N('', {
        data: requestsToSend
      }, 'payment_requests/sendmessagediretor');
      
      toast({
        title: 'Enviado',
        description: `${ids.length} solicitação(s) enviada(s) para aprovação do diretor`,
      });
      setSelectedIds(new Set());
      loadRequests();
    } catch (error) {
      toast({
        title: 'Erro',
        description: (error as Error)?.message || 'Erro ao enviar para o diretor',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const openSendToSystemModal = (ids: string[]) => {
    // Verificar se todas as solicitações têm aprovação de departamento
    const requestsToSend = requests.filter(r => ids.includes(r.id));
    const notApproved = requestsToSend.filter(r => r.approved_department !== 'APPROVED');
    
    if (notApproved.length > 0) {
      toast({
        title: 'Erro',
        description: 'Apenas solicitações com aprovação de departamento podem ser enviadas para o sistema.',
        variant: 'destructive',
      });
      return;
    }

    setSelectedRequestsForAction(ids);
    setSendToSystemModalOpen(true);
  };

  const handleConfirmSendToSystem = async () => {
    setLoading(true);
    try {
      // TODO: Implementar chamada à API para enviar ao sistema com os dados do modal
      // await sendPaymentRequestsToSystem(selectedRequestsForAction, formData);
      toast({
        title: 'Enviado',
        description: `${selectedRequestsForAction.length} solicitação(s) enviada(s) para o sistema`,
      });
      setSendToSystemModalOpen(false);
      setSelectedRequestsForAction([]);
      setSelectedIds(new Set());
      loadRequests();
    } catch (error) {
      toast({
        title: 'Erro',
        description: (error as Error)?.message || 'Erro ao enviar para o sistema',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRequest = async () => {
    if (!requestToDelete) return;
    
    setLoading(true);
    try {
      await deletePaymentRequest(requestToDelete);

      toast({
        title: 'Excluído',
        description: 'Solicitação excluída com sucesso',
      });
      setDeleteConfirmOpen(false);
      setRequestToDelete(null);
      loadRequests();
    } catch (error) {
      toast({
        title: 'Erro',
        description: (error as Error)?.message || 'Erro ao excluir solicitação',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const openDeleteConfirm = (id: string) => {
    setRequestToDelete(id);
    setDeleteConfirmOpen(true);
  };

  // ===== Funções para Usuários WhatsApp =====
  const loadWhatsAppUsers = async (statusOverride?: string) => {
    setUsersLoading(true);
    try {
      const payload = {
        status: statusOverride !== undefined ? statusOverride : userStatusFilter,
        page: userCurrentPage,
        limit: userItemsPerPage,
      };

      const response = await fetchWhatsAppUsers(payload);
      
      if (response?.data?.[0]?.data) {
        const data = response.data[0].data;
        setAllWhatsappUsers(data);
        
        // Usa totalItems da paginação ou length dos dados
        const totalItems = response.data[0].pagination?.totalItems || data.length;
        setUserTotal(totalItems);
        
        // Aplicar filtro de busca no frontend
        applyUserFrontendFilters(data);
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao carregar usuários',
        variant: 'destructive',
      });
    } finally {
      setUsersLoading(false);
    }
  };

  const applyUserFrontendFilters = (users: WhatsAppUser[]) => {
    if (!userSearchTerm.trim()) {
      setWhatsappUsers(users);
      return;
    }

    const searchLower = userSearchTerm.toLowerCase();
    const filtered = users.filter((user) => {
      return (
        user.name_user?.toLowerCase().includes(searchLower) ||
        user.email_user?.toLowerCase().includes(searchLower) ||
        user.phone_user?.toLowerCase().includes(searchLower)
      );
    });

    setWhatsappUsers(filtered);
  };

  // Aplicar filtro de busca quando o termo mudar
  useEffect(() => {
    applyUserFrontendFilters(allWhatsappUsers);
  }, [userSearchTerm]);

  const handleCreateUser = async () => {
    // Validações
    if (!formUserName.trim()) {
      toast({ title: 'Erro', description: 'Nome é obrigatório', variant: 'destructive' });
      return;
    }
    if (!formUserPhone.trim()) {
      toast({ title: 'Erro', description: 'Telefone é obrigatório', variant: 'destructive' });
      return;
    }
    if (!formUserEmail.trim()) {
      toast({ title: 'Erro', description: 'Email é obrigatório', variant: 'destructive' });
      return;
    }
    if (!isValidEmail(formUserEmail)) {
      toast({ title: 'Erro', description: 'Email inválido', variant: 'destructive' });
      return;
    }

    setUserFormLoading(true);
    try {
      const payload = {
        name_user: formUserName.trim(),
        phone_user: cleanPhoneNumber(formUserPhone),
        email_user: formUserEmail.trim(),
        status: formUserStatus,
      };

      await createWhatsAppUser(payload);
      toast({ title: 'Sucesso', description: 'Usuário criado com sucesso' });
      setUserModalOpen(false);
      resetUserForm();
      loadWhatsAppUsers();
    } catch (error: any) {
      // Verifica o código de erro retornado pelo backend
      const errorData = error?.data || {};
      const errorCode = errorData?.code;
      
      let errorMessage = error?.message || 'Erro ao criar usuário';
      
      if (errorCode === 'user_exist') {
        errorMessage = 'Já existe um usuário cadastrado com esse número de telefone.';
      } else if (errorCode === 'user_link_exist') {
        errorMessage = 'Esse usuário não pode ser inativado por ter Vínculo de aprovação Cadastrado.';
      }
      
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setUserFormLoading(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!activeUser) return;

    // Validações
    if (!formUserName.trim()) {
      toast({ title: 'Erro', description: 'Nome é obrigatório', variant: 'destructive' });
      return;
    }
    if (!formUserPhone.trim()) {
      toast({ title: 'Erro', description: 'Telefone é obrigatório', variant: 'destructive' });
      return;
    }
    if (!formUserEmail.trim()) {
      toast({ title: 'Erro', description: 'Email é obrigatório', variant: 'destructive' });
      return;
    }
    if (!isValidEmail(formUserEmail)) {
      toast({ title: 'Erro', description: 'Email inválido', variant: 'destructive' });
      return;
    }

    setUserFormLoading(true);
    try {
      const payload = {
        id: activeUser.id,
        name_user: formUserName.trim(),
        phone_user: cleanPhoneNumber(formUserPhone),
        email_user: formUserEmail.trim(),
        status: formUserStatus,
      };

      await updateWhatsAppUser(payload);
      toast({ title: 'Sucesso', description: 'Usuário atualizado com sucesso' });
      setUserModalOpen(false);
      resetUserForm();
      loadWhatsAppUsers();
    } catch (error: any) {
      // Verifica o código de erro retornado pelo backend
      const errorData = error?.data || {};
      const errorCode = errorData?.code;
      
      let errorMessage = error?.message || 'Erro ao atualizar usuário';
      
      if (errorCode === 'user_exist') {
        errorMessage = 'Já existe um usuário cadastrado com esse número de telefone.';
      } else if (errorCode === 'user_link_exist') {
        errorMessage = 'Esse usuário não pode ser inativado por ter Vínculo de aprovação Cadastrado.';
      }
      
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setUserFormLoading(false);
    }
  };

  const openUserCreateModal = () => {
    resetUserForm();
    setUserEditMode(false);
    setUserModalOpen(true);
  };

  const openUserEditModal = (user: WhatsAppUser) => {
    setActiveUser(user);
    setFormUserName(user.name_user);
    // Remove o código 55 do Brasil e formata
    const phoneWithoutCountryCode = user.phone_user.startsWith('55') 
      ? user.phone_user.substring(2) 
      : user.phone_user;
    setFormUserPhone(formatPhoneNumber(phoneWithoutCountryCode));
    setFormUserEmail(user.email_user);
    setFormUserStatus(user.status);
    setUserEditMode(true);
    setUserModalOpen(true);
  };

  const resetUserForm = () => {
    setFormUserName('');
    setFormUserPhone('');
    setFormUserEmail('');
    setFormUserStatus(true);
    setActiveUser(null);
  };

  // Carregar usuários quando a aba mudar
  useEffect(() => {
    if (activeTab === 'users') {
      loadWhatsAppUsers();
    }
  }, [activeTab, userCurrentPage, userItemsPerPage]);

  // ===== Funções para Vínculos de Aprovação =====
  
  // Função auxiliar para carregar usuários para os comboboxes
  const loadUsersForCombobox = async () => {
    try {
      await loadWhatsAppUsers();
    } catch (error) {
      console.error('Erro ao carregar usuários para combobox:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar lista de usuários',
        variant: 'destructive',
      });
    }
  };
  
  const loadApprovalLinks = async () => {
    setLinksLoading(true);
    try {
      const payload = {
        page: linkCurrentPage,
        limit: linkItemsPerPage,
      };

      const response = await fetchApprovalLinks(payload);
      
      if (response?.data?.[0]?.data) {
        const data = response.data[0].data;
        setAllApprovalLinks(data);
        
        // Usa totalItems da paginação ou length dos dados
        const totalItems = response.data[0].pagination?.totalItems || data.length;
        setLinkTotal(totalItems);
        
        // Aplicar filtro de busca no frontend
        applyLinkFrontendFilters(data);
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao carregar vínculos de aprovação',
        variant: 'destructive',
      });
    } finally {
      setLinksLoading(false);
    }
  };

  const applyLinkFrontendFilters = (links: ApprovalLink[]) => {
    if (!linkSearchTerm.trim()) {
      setApprovalLinks(links);
      return;
    }

    const searchLower = linkSearchTerm.toLowerCase();
    const filtered = links.filter((link) => {
      return (
        link.user_name?.toLowerCase().includes(searchLower) ||
        link.user_id?.toLowerCase().includes(searchLower)
      );
    });

    setApprovalLinks(filtered);
  };

  // Aplicar filtro de busca quando o termo mudar
  useEffect(() => {
    applyLinkFrontendFilters(allApprovalLinks);
  }, [linkSearchTerm]);

  const handleCreateLink = async () => {
    // Validações
    if (!formLinkUserId) {
      toast({ title: 'Erro', description: 'Selecione um usuário', variant: 'destructive' });
      return;
    }
    if (!formLinkApproverDepartmentId) {
      toast({ title: 'Erro', description: 'Selecione um aprovador de departamento', variant: 'destructive' });
      return;
    }
    if (!formLinkApproverDirectorId) {
      toast({ title: 'Erro', description: 'Selecione um aprovador de diretoria', variant: 'destructive' });
      return;
    }

    // Validação: Usuário não pode ser igual aos aprovadores
    if (formLinkUserId === formLinkApproverDepartmentId) {
      toast({ 
        title: 'Erro', 
        description: 'O usuário não pode ser o mesmo que o aprovador de departamento', 
        variant: 'destructive' 
      });
      return;
    }
    if (formLinkUserId === formLinkApproverDirectorId) {
      toast({ 
        title: 'Erro', 
        description: 'O usuário não pode ser o mesmo que o aprovador de diretoria', 
        variant: 'destructive' 
      });
      return;
    }

    setLinkFormLoading(true);
    try {
      const payload = {
        user_id: formLinkUserId,
        approver_department_id: formLinkApproverDepartmentId,
        approver_director_id: formLinkApproverDirectorId,
      };

      await createApprovalLink(payload);
      toast({ title: 'Sucesso', description: 'Vínculo criado com sucesso' });
      setLinkModalOpen(false);
      resetLinkForm();
      loadApprovalLinks();
    } catch (error: any) {
      // Verifica o código de erro retornado pelo backend
      const errorData = error?.data || {};
      const errorCode = errorData?.code;
      
      let errorMessage = error?.message || 'Erro ao criar vínculo';
      
      if (errorCode === 'user_link_exist') {
        errorMessage = 'Esse usuário já tem vínculo cadastrado.';
      }
      
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLinkFormLoading(false);
    }
  };

  const handleUpdateLink = async () => {
    if (!activeLink) return;

    // Validações
    if (!formLinkUserId) {
      toast({ title: 'Erro', description: 'Selecione um usuário', variant: 'destructive' });
      return;
    }
    if (!formLinkApproverDepartmentId) {
      toast({ title: 'Erro', description: 'Selecione um aprovador de departamento', variant: 'destructive' });
      return;
    }
    if (!formLinkApproverDirectorId) {
      toast({ title: 'Erro', description: 'Selecione um aprovador de diretoria', variant: 'destructive' });
      return;
    }

    // Validação: Usuário não pode ser igual aos aprovadores
    if (formLinkUserId === formLinkApproverDepartmentId) {
      toast({ 
        title: 'Erro', 
        description: 'O usuário não pode ser o mesmo que o aprovador de departamento', 
        variant: 'destructive' 
      });
      return;
    }
    if (formLinkUserId === formLinkApproverDirectorId) {
      toast({ 
        title: 'Erro', 
        description: 'O usuário não pode ser o mesmo que o aprovador de diretoria', 
        variant: 'destructive' 
      });
      return;
    }

    setLinkFormLoading(true);
    try {
      const payload = {
        id: activeLink.id,
        user_id: formLinkUserId,
        approver_department_id: formLinkApproverDepartmentId,
        approver_director_id: formLinkApproverDirectorId,
      };

      await updateApprovalLink(payload);
      toast({ title: 'Sucesso', description: 'Vínculo atualizado com sucesso' });
      setLinkModalOpen(false);
      resetLinkForm();
      loadApprovalLinks();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error?.message || 'Erro ao atualizar vínculo',
        variant: 'destructive',
      });
    } finally {
      setLinkFormLoading(false);
    }
  };

  const handleDeleteLink = async () => {
    if (!linkToDelete) return;
    
    setLinkFormLoading(true);
    try {
      await deleteApprovalLink(linkToDelete);
      toast({ title: 'Sucesso', description: 'Vínculo excluído com sucesso' });
      setLinkDeleteModalOpen(false);
      setLinkToDelete(null);
      loadApprovalLinks();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error?.message || 'Erro ao excluir vínculo',
        variant: 'destructive',
      });
    } finally {
      setLinkFormLoading(false);
    }
  };

  const openLinkCreateModal = async () => {
    resetLinkForm();
    setLinkEditMode(false);
    setLinkModalOpen(true);
    
    // Carregar usuários ativos para os comboboxes
    await loadUsersForCombobox();
  };

  const openLinkEditModal = async (link: ApprovalLink) => {
    setActiveLink(link);
    setFormLinkUserId(link.user_id);
    setFormLinkApproverDepartmentId(link.approver_department_id);
    setFormLinkApproverDirectorId(link.approver_director_id);
    setLinkEditMode(true);
    setLinkModalOpen(true);
    
    // Carregar usuários ativos para os comboboxes
    await loadUsersForCombobox();
  };

  const openLinkDeleteConfirm = (id: string) => {
    setLinkToDelete(id);
    setLinkDeleteModalOpen(true);
  };

  const resetLinkForm = () => {
    setFormLinkUserId('');
    setFormLinkApproverDepartmentId('');
    setFormLinkApproverDirectorId('');
    setActiveLink(null);
  };

  // Carregar vínculos quando a aba mudar
  useEffect(() => {
    if (activeTab === 'approvals') {
      loadApprovalLinks();
    }
  }, [activeTab, linkCurrentPage, linkItemsPerPage]);

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Solicitações de Pagamento</h1>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="requests" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Solicitações</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Usuários WhatsApp</span>
            </TabsTrigger>
            <TabsTrigger value="approvals" className="flex items-center gap-2">
              <Link className="h-4 w-4" />
              <span className="hidden sm:inline">Vínculos de Aprovação</span>
            </TabsTrigger>
          </TabsList>

          {/* Aba de Solicitações */}
          <TabsContent value="requests" className="space-y-6">
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
              {/* Linha 1: Datas + Busca textual (4 colunas, busca ocupa 2) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label>Data Inicial</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label>Data Final</Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <Label>Buscar por Solicitante/Email</Label>
                  <Input
                    placeholder="Digite para buscar..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {/* Linha 2: Usuários + Aprovações + Departamento (4 colunas) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label>Usuários</Label>
                  <Select 
                    value={selectedFilters.userId} 
                    onValueChange={(value) => setSelectedFilters(prev => ({ ...prev, userId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {allWhatsappUsers.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name_user}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Aprovação Departamento</Label>
                  <Select 
                    value={selectedFilters.approvedDepartment} 
                    onValueChange={(value) => setSelectedFilters(prev => ({ ...prev, approvedDepartment: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="PENDING">Pendente</SelectItem>
                      <SelectItem value="APPROVED">Aprovado</SelectItem>
                      <SelectItem value="REPROVED">Reprovado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Aprovação Diretor</Label>
                  <Select 
                    value={selectedFilters.approvedDirector} 
                    onValueChange={(value) => setSelectedFilters(prev => ({ ...prev, approvedDirector: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="PENDING">Pendente</SelectItem>
                      <SelectItem value="APPROVED">Aprovado</SelectItem>
                      <SelectItem value="REPROVED">Reprovado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Departamento</Label>
                  <Select 
                    value={selectedFilters.department} 
                    onValueChange={(value) => setSelectedFilters(prev => ({ ...prev, department: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="Comercial">Comercial</SelectItem>
                      <SelectItem value="Produção foto">Produção foto</SelectItem>
                      <SelectItem value="Produção vídeo">Produção vídeo</SelectItem>
                      <SelectItem value="Marketing">Marketing</SelectItem>
                      <SelectItem value="Financeiro">Financeiro</SelectItem>
                      <SelectItem value="Diretoria">Diretoria</SelectItem>
                      <SelectItem value="Corporativo P7 filmes">Corporativo P7 filmes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Linha 3: Empresa + Tipo de Pagamento + Tipo de Pessoa (4 colunas, última vazia) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label>Empresa</Label>
                  <Select 
                    value={selectedFilters.paymentCompany} 
                    onValueChange={(value) => setSelectedFilters(prev => ({ ...prev, paymentCompany: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="TAJ - Noivas">TAJ - Noivas</SelectItem>
                      <SelectItem value="TAJ - Salão">TAJ - Salão</SelectItem>
                      <SelectItem value="Estudio Produtora 7">Estudio Produtora 7</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Tipo de Pagamento</Label>
                  <Select 
                    value={selectedFilters.paymentType} 
                    onValueChange={(value) => setSelectedFilters(prev => ({ ...prev, paymentType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="Normal">Normal</SelectItem>
                      <SelectItem value="Especial">Especial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Tipo de Pessoa</Label>
                  <Select 
                    value={selectedFilters.personType} 
                    onValueChange={(value) => setSelectedFilters(prev => ({ ...prev, personType: value as 'fisica' | 'juridica' | 'all' }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="fisica">Física</SelectItem>
                      <SelectItem value="juridica">Jurídica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  {/* Espaço reservado para futuro filtro */}
                </div>
              </div>

              {/* Linha 4: Botões de filtrar */}
              <div className="flex flex-col sm:flex-row justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    // Resetar datas para o mês atual
                    const now = new Date();
                    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
                    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                    setStartDate(firstDay.toISOString().split('T')[0]);
                    setEndDate(lastDay.toISOString().split('T')[0]);
                    
                    // Resetar filtros
                    setSelectedFilters({
                      department: 'all',
                      paymentCompany: 'all',
                      paymentType: 'all',
                      personType: 'all',
                      approvedDepartment: 'all',
                      approvedDirector: 'all',
                      userId: 'all'
                    });
                    setSearchTerm('');
                    
                    // Resetar página para 1
                    setCurrentPage(1);
                  }}
                  className="w-full sm:w-auto"
                >
                  Limpar Filtros
                </Button>
                <Button 
                  onClick={() => {
                    setCurrentPage(1);
                    loadRequests();
                  }} 
                  variant="default"
                  className="w-full sm:w-auto"
                >
                  <Search className="h-4 w-4 mr-2"/>
                  Filtrar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Batch Action Buttons */}
        {selectedIds.size > 0 && (
          <Card className="shadow-financial">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-sm text-muted-foreground">
                  {selectedIds.size} solicitação(s) selecionada(s)
                </span>
                <Button
                  onClick={() => handleSendToDirector(Array.from(selectedIds))}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <Send className="h-4 w-4" />
                  Enviar p/ Diretor
                </Button>
                <Button
                  onClick={() => openSendToSystemModal(Array.from(selectedIds))}
                  variant="default"
                  size="sm"
                  className="gap-2"
                >
                  <Send className="h-4 w-4" />
                  Enviar p/ Sistema
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="shadow-financial">
          <CardContent className="p-0">
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto rounded-md shadow-sm">
              <table className="w-full border-collapse">
                <thead className="bg-muted/50 border-b border-border">
                  <tr className="hover:bg-muted/5 transition-colors">
                    <th className="p-4 text-left font-medium text-muted-foreground">
                      <Checkbox 
                        checked={selectedIds.size === requests.length && requests.length>0} 
                        onCheckedChange={(c)=>handleSelectAll(!!c)}
                        className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground" 
                      />
                    </th>
                    <th className="p-4 text-left font-medium text-muted-foreground">Solicitante</th>
                    <th className="p-4 text-left font-medium text-muted-foreground">Depto</th>
                    <th className="p-4 text-left">Empresa</th>
                    <th className="p-4 text-left">Cliente</th>
                    <th className="p-4 text-left">Pedido</th>
                    <th className="p-4 text-left">Tipo Pagto</th>
                    <th className="p-4 text-left">Forma Pagto</th>
                    <th className="p-4 text-left">Valor</th>
                    <th className="p-4 text-left">Dt Vencto</th>
                    <th className="p-4 text-left">Aprov Depto</th>
                    <th className="p-4 text-left">Aprov Diretor</th>
                    <th className="p-4 text-left">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {requestsLoading ? (
                    <tr key="loading"><td colSpan={13} className="p-8 text-center"><div className="flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin mr-2"/>Carregando...</div></td></tr>
                  ) : requests.length===0 ? (
                    <tr key="empty"><td colSpan={13} className="p-8 text-center text-muted-foreground">Nenhum registro encontrado.</td></tr>
                  ) : (
                    requests.map((r, index)=> (
                      <tr key={r.id || `request-${index}`} className="border-b hover:bg-muted/20 transition-colors">
                        <td className="p-4"><Checkbox checked={selectedIds.has(r.id)} onCheckedChange={(c)=>handleSelect(r.id, !!c)} /></td>
                        <td className="p-4">{r.requester}</td>
                        <td className="p-4">{r.department}</td>
                        <td className="p-4">{companyDbToDisplay(r.payment_company)}</td>
                        <td className="p-4">{r.client_name}</td>
                        <td className="p-4">{r.contract_number}</td>
                        <td className="p-4">{r.payment_type}</td>
                        <td className="p-4">{r.modality}</td>
                        <td className="p-4">{safeFormatCurrency(r.expense_value)}</td>
                        <td className="p-4">{safeFormatDate(r.due_date)}</td>
                        <td className="p-4">
                          {
                            (() => {
                              const m = mapApproval(r.approved_department);
                              return <Badge variant={m.variant}>{m.label}</Badge>;
                            })()
                          }
                        </td>
                        <td className="p-4">
                          {
                            (() => {
                              const m = mapApproval(r.approved_director);
                              return <Badge variant={m.variant}>{m.label}</Badge>;
                            })()
                          }
                        </td>
                        <td className="p-4">
                          <div className="relative">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="sm" variant="ghost">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleView(r)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Visualizar
                                </DropdownMenuItem>
                                {r.approved_department === 'PENDING' && r.approved_director === 'PENDING' && (
                                  <DropdownMenuItem onClick={() => openDeleteConfirm(r.id)} className="text-destructive">
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Excluir
                                  </DropdownMenuItem>
                                )}
                                {r.approved_department === 'APPROVED' && r.approved_director === 'PENDING' && (
                                  <DropdownMenuItem onClick={() => handleSendToDirector([r.id])}>
                                    <Send className="h-4 w-4 mr-2" />
                                    Enviar p/ Diretor
                                  </DropdownMenuItem>
                                )}
                                {r.approved_department === 'APPROVED' && (
                                  <DropdownMenuItem onClick={() => openSendToSystemModal([r.id])} className="text-primary">
                                    <Send className="h-4 w-4 mr-2" />
                                    Enviar p/ Sistema
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile View */}
            <div className="md:hidden divide-y divide-border">
              {requestsLoading ? (
                <div className="p-8 text-center">
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin mr-2"/>Carregando...
                  </div>
                </div>
              ) : requests.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  Nenhum registro encontrado.
                </div>
              ) : (
                requests.map((r, index) => (
                  <div key={r.id || `mobile-request-${index}`} className="p-4 bg-popover border border-border rounded-lg shadow-sm space-y-4">
                    {/* Cabeçalho do Card */}
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-semibold text-lg text-foreground">{r.requester}</div>
                        <div className="text-sm text-muted-foreground">{companyDbToDisplay(r.payment_company)}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-lg text-foreground">{safeFormatCurrency(r.expense_value)}</div>
                        <div className="text-sm text-muted-foreground">{safeFormatDate(r.due_date)}</div>
                      </div>
                    </div>
          
                    {/* Informações principais */}
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="text-muted-foreground">Departamento</div>
                        <div className="text-right">{r.department}</div>
                        <div className="text-muted-foreground">Cliente</div>
                        <div className="text-right">{r.client_name}</div>
                        <div className="text-muted-foreground">Nº Pedido</div>
                        <div className="text-right">{r.contract_number}</div>
                        <div className="text-muted-foreground">Tipo</div>
                        <div className="text-right">{r.payment_type}</div>
                      </div>
                    </div>
          
                    {/* Status de Aprovação */}
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Aprov. Depto</div>
                          {(() => {
                            const m = mapApproval(r.approved_department);
                            return <Badge variant={m.variant}>{m.label}</Badge>;
                          })()}
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Aprov. Diretor</div>
                          {(() => {
                            const m = mapApproval(r.approved_director);
                            return <Badge variant={m.variant}>{m.label}</Badge>;
                          })()}
                        </div>
                    </div>
          
                    {/* Ações */}
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
                      <Checkbox 
                        checked={selectedIds.has(r.id)} 
                        onCheckedChange={(c)=>handleSelect(r.id, !!c)}
                      />
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="ghost" onClick={() => handleView(r)}>
                          <Eye className="h-4 w-4"/>
                        </Button>
                        {r.approved_department === 'PENDING' && r.approved_director === 'PENDING' && (
                          <Button size="sm" variant="destructive" onClick={()=>openDeleteConfirm(r.id)}>
                            <Trash2 className="h-4 w-4"/>
                          </Button>
                        )}
                        {r.approved_department === 'APPROVED' && r.approved_director === 'PENDING' && (
                          <Button size="sm" variant="outline" onClick={() => handleSendToDirector([r.id])}>
                            <Send className="h-4 w-4"/>
                          </Button>
                        )}
                        {r.approved_department === 'APPROVED' && (
                          <Button size="sm" variant="default" className="bg-primary hover:bg-primary/90" onClick={() => openSendToSystemModal([r.id])}>
                            <Send className="h-4 w-4"/>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Paginação */}
        <Card className="shadow-card">
          <CardContent className="py-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                <span className="text-sm text-muted-foreground">
                  Página {currentPage} de {Math.ceil(total / itemsPerPage) || 1}
                </span>
                <span className="text-sm text-muted-foreground">
                  Total: {total} {total === 1 ? 'registro' : 'registros'}
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
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1 || requestsLoading}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(Math.ceil(total / itemsPerPage), p + 1))}
                  disabled={currentPage === Math.ceil(total / itemsPerPage) || requestsLoading}
                >
                  Próxima
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
          </TabsContent>

          {/* Aba de Usuários WhatsApp */}
          <TabsContent value="users" className="space-y-6">
            {/* Filtros de Usuários */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Search className="h-5 w-5 text-primary" />
                    Filtros de Usuários
                  </CardTitle>
                  <Button onClick={openUserCreateModal}>
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Usuário
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Buscar (Nome, Email ou Telefone)</Label>
                    <Input
                      placeholder="Digite para buscar..."
                      value={userSearchTerm}
                      onChange={(e) => setUserSearchTerm(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Select value={userStatusFilter} onValueChange={(value) => {
                      setUserStatusFilter(value);
                      loadWhatsAppUsers(value);
                    }}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Ativo</SelectItem>
                        <SelectItem value="false">Inativo</SelectItem>
                        <SelectItem value="all">Todos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Botões de ação */}
                <div className="flex flex-col sm:flex-row justify-end gap-2 mt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setUserSearchTerm('');
                      setUserStatusFilter('true');
                      setUserCurrentPage(1);
                      loadWhatsAppUsers('true');
                    }}
                    className="w-full sm:w-auto"
                  >
                    Limpar Filtros
                  </Button>
                  <Button 
                    onClick={() => {
                      setUserCurrentPage(1);
                      loadWhatsAppUsers();
                    }} 
                    variant="default"
                    className="w-full sm:w-auto"
                  >
                    <Search className="h-4 w-4 mr-2"/>
                    Filtrar
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Tabela de Usuários */}
            <Card>
              <CardHeader>
                <CardTitle>Usuários Cadastrados</CardTitle>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : whatsappUsers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum usuário encontrado para o filtro selecionado
                  </div>
                ) : (
                  <>
                    {/* Desktop */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="p-4 text-left font-semibold">Nome</th>
                            <th className="p-4 text-left font-semibold">Email</th>
                            <th className="p-4 text-left font-semibold">Telefone</th>
                            <th className="p-4 text-left font-semibold">Status</th>
                            <th className="p-4 text-left font-semibold">Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {whatsappUsers.map((user) => (
                            <tr key={user.id} className="border-b border-border hover:bg-muted/30">
                              <td className="p-4">{user.name_user}</td>
                              <td className="p-4">{user.email_user}</td>
                              <td className="p-4">{user.phone_user}</td>
                              <td className="p-4">
                                <Badge variant={user.status ? 'success' : 'secondary'}>
                                  {user.status ? 'Ativo' : 'Inativo'}
                                </Badge>
                              </td>
                              <td className="p-4">
                                <Button size="sm" variant="ghost" onClick={() => openUserEditModal(user)}>
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile */}
                    <div className="md:hidden space-y-4">
                      {whatsappUsers.map((user) => (
                        <Card key={user.id}>
                          <CardContent className="p-4">
                            <div className="space-y-2">
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="font-semibold">{user.name_user}</div>
                                  <div className="text-sm text-muted-foreground">{user.email_user}</div>
                                  <div className="text-sm text-muted-foreground">{user.phone_user}</div>
                                </div>
                                <Badge variant={user.status ? 'success' : 'secondary'}>
                                  {user.status ? 'Ativo' : 'Inativo'}
                                </Badge>
                              </div>
                              <Button size="sm" variant="outline" className="w-full" onClick={() => openUserEditModal(user)}>
                                <Edit2 className="h-4 w-4 mr-2" />
                                Editar
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Paginação */}
            <Card className="shadow-card">
              <CardContent className="py-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                    <span className="text-sm text-muted-foreground">
                      Página {userCurrentPage} de {Math.ceil(userTotal / userItemsPerPage) || 1}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      Total: {userTotal} {userTotal === 1 ? 'usuário' : 'usuários'}
                    </span>

                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        Itens por página:
                      </span>
                      <Select
                        value={userItemsPerPage.toString()}
                        onValueChange={(value) => {
                          setUserItemsPerPage(Number(value));
                          setUserCurrentPage(1);
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
                      onClick={() => setUserCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={userCurrentPage === 1 || usersLoading}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setUserCurrentPage((p) => Math.min(Math.ceil(userTotal / userItemsPerPage), p + 1))}
                      disabled={userCurrentPage === Math.ceil(userTotal / userItemsPerPage) || usersLoading}
                    >
                      Próxima
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba de Vínculos de Aprovação */}
          <TabsContent value="approvals" className="space-y-6">
            {/* Filtros de Vínculos */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Search className="h-5 w-5 text-primary" />
                    Vínculos de Aprovação
                  </CardTitle>
                  <Button onClick={openLinkCreateModal}>
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Vínculo
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Buscar por Usuário</Label>
                    <Input
                      placeholder="Digite o nome do usuário..."
                      value={linkSearchTerm}
                      onChange={(e) => setLinkSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                {/* Botões de ação */}
                <div className="flex flex-col sm:flex-row justify-end gap-2 mt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setLinkSearchTerm('');
                      setLinkCurrentPage(1);
                    }}
                    className="w-full sm:w-auto"
                  >
                    Limpar Filtros
                  </Button>
                  <Button 
                    onClick={() => {
                      setLinkCurrentPage(1);
                      loadApprovalLinks();
                    }} 
                    variant="default"
                    className="w-full sm:w-auto"
                  >
                    <Search className="h-4 w-4 mr-2"/>
                    Filtrar
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Tabela de Vínculos */}
            <Card>
              <CardHeader>
                <CardTitle>Vínculos Cadastrados</CardTitle>
              </CardHeader>
              <CardContent>
                {linksLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : approvalLinks.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum vínculo encontrado para o filtro selecionado
                  </div>
                ) : (
                  <>
                    {/* Desktop */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="p-4 text-left font-semibold">Usuário</th>
                            <th className="p-4 text-left font-semibold">Aprov. Departamento</th>
                            <th className="p-4 text-left font-semibold">Aprov. Diretoria</th>
                            <th className="p-4 text-left font-semibold">Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {approvalLinks.map((link) => (
                            <tr key={link.id} className="border-b border-border hover:bg-muted/30">
                              <td className="p-4">{link.user_name || link.user_id}</td>
                              <td className="p-4">{link.approver_department_name || link.approver_department_id}</td>
                              <td className="p-4">{link.approver_director_name || link.approver_director_id}</td>
                              <td className="p-4 flex gap-2">
                                <Button size="sm" variant="ghost" onClick={() => openLinkEditModal(link)}>
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => openLinkDeleteConfirm(link.id)}>
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile */}
                    <div className="md:hidden space-y-4">
                      {approvalLinks.map((link) => (
                        <Card key={link.id}>
                          <CardContent className="p-4">
                            <div className="space-y-2">
                              <div>
                                <div className="font-semibold">{link.user_name || link.user_id}</div>
                                <div className="text-sm text-muted-foreground mt-1">
                                  <div>Depto: {link.approver_department_name || link.approver_department_id}</div>
                                  <div>Diretoria: {link.approver_director_name || link.approver_director_id}</div>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline" className="flex-1" onClick={() => openLinkEditModal(link)}>
                                  <Edit2 className="h-4 w-4 mr-2" />
                                  Editar
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => openLinkDeleteConfirm(link.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Paginação */}
            <Card className="shadow-card">
              <CardContent className="py-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                    <span className="text-sm text-muted-foreground">
                      Página {linkCurrentPage} de {Math.ceil(linkTotal / linkItemsPerPage) || 1}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      Total: {linkTotal} {linkTotal === 1 ? 'vínculo' : 'vínculos'}
                    </span>

                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        Itens por página:
                      </span>
                      <Select
                        value={linkItemsPerPage.toString()}
                        onValueChange={(value) => {
                          setLinkItemsPerPage(Number(value));
                          setLinkCurrentPage(1);
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
                      onClick={() => setLinkCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={linkCurrentPage === 1 || linksLoading}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setLinkCurrentPage((p) => Math.min(Math.ceil(linkTotal / linkItemsPerPage), p + 1))}
                      disabled={linkCurrentPage === Math.ceil(linkTotal / linkItemsPerPage) || linksLoading}
                    >
                      Próxima
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

      {/* Create Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="max-h-[90vh] sm:max-h-[80vh] w-[95vw] sm:w-[90vw] max-w-none md:max-w-[1200px] md:w-[min(1200px,90vw)] flex flex-col">
          <DialogHeader>
            <DialogTitle>Criar Solicitação</DialogTitle>
            <DialogDescription>Preencha os dados para criar uma nova solicitação de pagamento.</DialogDescription>
          </DialogHeader>

          <div className="overflow-y-auto py-4 px-4 flex-1">
            <PaymentRequestForm
              data={{
                requester: formRequester,
                requesterEmail: formRequesterEmail,
                department: formDepartment,
                paymentCompany: formPaymentCompany,
                clientName: formClientName,
                contractNumber: formContractNumber,
                reason: formReason,
                paymentType: formPaymentType,
                modality: formModality,
                expenseValue: formExpenseValue,
                dueDate: formDueDate,
                personType: formPersonType,
                titular: formTitular,
                cpfCnpj: formCpfCnpj,
                bank: formBank,
                agency: formAgency,
                account: formAccount,
                pixType: formPixType,
                pixKey: formPixKey,
              }}
              onChange={handleFormChange}
              formatCpfCnpj={formatCpfCnpj}
              formatCurrency={formatCurrency}
            />
          </div>
          <DialogFooter className="flex-shrink-0">
            <Button variant="outline" onClick={()=>setCreateModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={formLoading}>{formLoading? 'Enviando...':'Criar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View/Edit Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="max-h-[90vh] sm:max-h-[80vh] w-[95vw] sm:w-[90vw] max-w-none md:max-w-[1200px] md:w-[min(1200px,90vw)] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {activeRequest?.approved_department === 'PENDING' && activeRequest?.approved_director === 'PENDING' 
                ? 'Editar Solicitação' 
                : 'Visualizar Solicitação'}
            </DialogTitle>
            <DialogDescription>
              {activeRequest?.approved_department === 'PENDING' && activeRequest?.approved_director === 'PENDING'
                ? 'Você pode editar os dados desta solicitação pois ela ainda não foi aprovada.'
                : 'Esta solicitação já foi processada e não pode ser editada.'}
            </DialogDescription>
          </DialogHeader>

          <div className="overflow-y-auto py-4 px-4 flex-1">
            <PaymentRequestForm
              data={{
                requester: formRequester,
                requesterEmail: formRequesterEmail,
                department: formDepartment,
                paymentCompany: formPaymentCompany,
                clientName: formClientName,
                contractNumber: formContractNumber,
                reason: formReason,
                paymentType: formPaymentType,
                modality: formModality,
                expenseValue: formExpenseValue,
                dueDate: formDueDate,
                personType: formPersonType,
                titular: formTitular,
                cpfCnpj: formCpfCnpj,
                bank: formBank,
                agency: formAgency,
                account: formAccount,
                pixType: formPixType,
                pixKey: formPixKey,
              }}
              onChange={handleFormChange}
              formatCpfCnpj={formatCpfCnpj}
              formatCurrency={formatCurrency}
              disabled={activeRequest?.approved_department !== 'PENDING' || activeRequest?.approved_director !== 'PENDING'}
              isEditMode={true}
            />
          </div>
          
          <DialogFooter className="flex-shrink-0 flex justify-between items-center">
            <div>
              {activeRequest?.approved_department === 'PENDING' && activeRequest?.approved_director === 'PENDING' && (
                <Button 
                  variant="destructive" 
                  onClick={() => {
                    setViewModalOpen(false);
                    openDeleteConfirm(activeRequest.id);
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setViewModalOpen(false)}>Fechar</Button>
              {activeRequest?.approved_department === 'PENDING' && activeRequest?.approved_director === 'PENDING' && (
                <Button onClick={handleUpdate} disabled={formLoading}>
                  {formLoading ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-h-[90vh] sm:max-h-[80vh] w-[95vw] sm:w-[90vw] max-w-none md:max-w-[1200px] md:w-[min(1200px,90vw)] flex flex-col">
          <DialogHeader>
            <DialogTitle>Editar Solicitação</DialogTitle>
          </DialogHeader>

          <div className="overflow-y-auto py-4 px-4 flex-1">
            <PaymentRequestForm
              data={{
                requester: formRequester,
                requesterEmail: formRequesterEmail,
                department: formDepartment,
                paymentCompany: formPaymentCompany,
                clientName: formClientName,
                contractNumber: formContractNumber,
                reason: formReason,
                paymentType: formPaymentType,
                modality: formModality,
                expenseValue: formExpenseValue,
                dueDate: formDueDate,
                personType: formPersonType,
                titular: formTitular,
                cpfCnpj: formCpfCnpj,
                bank: formBank,
                agency: formAgency,
                account: formAccount,
                pixType: formPixType,
                pixKey: formPixKey,
              }}
              onChange={handleFormChange}
              formatCpfCnpj={formatCpfCnpj}
              formatCurrency={formatCurrency}
            />
          </div>
          <DialogFooter className="flex-shrink-0">
            <Button variant="outline" onClick={()=>setEditModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleUpdate} disabled={formLoading}>{formLoading? 'Salvando...':'Salvar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>Deseja realmente deletar esta solicitação?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={()=>setDeleteModalOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={formLoading}>{formLoading? 'Deletando...':'Deletar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir esta solicitação de pagamento? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteRequest} disabled={loading}>
              {loading ? 'Excluindo...' : 'Excluir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Usuário WhatsApp */}
      <Dialog open={userModalOpen} onOpenChange={setUserModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{userEditMode ? 'Editar Usuário' : 'Novo Usuário'}</DialogTitle>
            <DialogDescription>
              {userEditMode ? 'Atualize as informações do usuário WhatsApp.' : 'Cadastre um novo usuário WhatsApp para usar o bot.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Nome *</Label>
              <Input
                value={formUserName}
                onChange={(e) => setFormUserName(e.target.value)}
                placeholder="Nome completo"
              />
            </div>
            <div>
              <Label>Telefone *</Label>
              <Input
                value={formUserPhone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder="(00) 00000-0000"
                maxLength={15}
              />
            </div>
            <div>
              <Label>Email *</Label>
              <Input
                type="email"
                value={formUserEmail}
                onChange={(e) => setFormUserEmail(e.target.value)}
                placeholder="email@exemplo.com"
              />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={formUserStatus ? 'true' : 'false'} onValueChange={(v) => setFormUserStatus(v === 'true')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Ativo</SelectItem>
                  <SelectItem value="false">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUserModalOpen(false)} disabled={userFormLoading}>
              Cancelar
            </Button>
            <Button onClick={userEditMode ? handleUpdateUser : handleCreateUser} disabled={userFormLoading}>
              {userFormLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {userEditMode ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Vínculo de Aprovação */}
      <Dialog open={linkModalOpen} onOpenChange={setLinkModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{linkEditMode ? 'Editar Vínculo' : 'Novo Vínculo'}</DialogTitle>
            <DialogDescription>
              {linkEditMode ? 'Atualize as informações do vínculo de aprovação.' : 'Cadastre um novo vínculo entre usuário e aprovador.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Usuário *</Label>
              <Popover open={userComboOpen} onOpenChange={setUserComboOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={userComboOpen}
                    className="w-full justify-between"
                    disabled={linkEditMode}
                  >
                    {formLinkUserId
                      ? allWhatsappUsers.find((user) => user.id === formLinkUserId)?.name_user || formLinkUserId
                      : "Selecione um usuário..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Buscar usuário..." />
                    <CommandList>
                      <CommandEmpty>
                        {allWhatsappUsers.length === 0 ? 'Carregando usuários...' : 'Nenhum usuário encontrado.'}
                      </CommandEmpty>
                      <CommandGroup>
                        {allWhatsappUsers.map((user) => (
                            <CommandItem
                              key={user.id}
                              value={`${user.name_user} ${user.phone_user}`}
                              onSelect={() => {
                                setFormLinkUserId(user.id);
                                setUserComboOpen(false);
                              }}
                            >
                              <Check
                                className={`mr-2 h-4 w-4 ${
                                  formLinkUserId === user.id ? "opacity-100" : "opacity-0"
                                }`}
                              />
                              <div className="flex flex-col">
                                <span className="font-medium">{user.name_user}</span>
                                <span className="text-xs text-muted-foreground">
                                  {user.phone_user}
                                </span>
                              </div>
                            </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label>Aprovador Departamento *</Label>
              <Popover open={approverDeptComboOpen} onOpenChange={setApproverDeptComboOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={approverDeptComboOpen}
                    className="w-full justify-between"
                  >
                    {formLinkApproverDepartmentId
                      ? allWhatsappUsers.find((user) => user.id === formLinkApproverDepartmentId)?.name_user || formLinkApproverDepartmentId
                      : "Selecione aprovador departamento..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Buscar aprovador..." />
                    <CommandList>
                      <CommandEmpty>Nenhum aprovador encontrado.</CommandEmpty>
                      <CommandGroup>
                        {allWhatsappUsers.filter((user) => user.id !== formLinkUserId).map((user) => (
                            <CommandItem
                              key={user.id}
                              value={`${user.name_user} ${user.phone_user}`}
                              onSelect={() => {
                                setFormLinkApproverDepartmentId(user.id);
                                setApproverDeptComboOpen(false);
                              }}
                            >
                              <Check
                                className={`mr-2 h-4 w-4 ${
                                  formLinkApproverDepartmentId === user.id ? "opacity-100" : "opacity-0"
                                }`}
                              />
                              <div className="flex flex-col">
                                <span className="font-medium">{user.name_user}</span>
                                <span className="text-xs text-muted-foreground">{user.phone_user}</span>
                              </div>
                            </CommandItem>
                          ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label>Aprovador Diretoria *</Label>
              <Popover open={approverDirComboOpen} onOpenChange={setApproverDirComboOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={approverDirComboOpen}
                    className="w-full justify-between"
                  >
                    {formLinkApproverDirectorId
                      ? allWhatsappUsers.find((user) => user.id === formLinkApproverDirectorId)?.name_user || formLinkApproverDirectorId
                      : "Selecione aprovador diretoria..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Buscar aprovador..." />
                    <CommandList>
                      <CommandEmpty>Nenhum aprovador encontrado.</CommandEmpty>
                      <CommandGroup>
                        {allWhatsappUsers.filter((user) => user.id !== formLinkUserId).map((user) => (
                            <CommandItem
                              key={user.id}
                              value={`${user.name_user} ${user.phone_user}`}
                              onSelect={() => {
                                setFormLinkApproverDirectorId(user.id);
                                setApproverDirComboOpen(false);
                              }}
                            >
                              <Check
                                className={`mr-2 h-4 w-4 ${
                                  formLinkApproverDirectorId === user.id ? "opacity-100" : "opacity-0"
                                }`}
                              />
                              <div className="flex flex-col">
                                <span className="font-medium">{user.name_user}</span>
                                <span className="text-xs text-muted-foreground">{user.phone_user}</span>
                              </div>
                            </CommandItem>
                          ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkModalOpen(false)} disabled={linkFormLoading}>
              Cancelar
            </Button>
            <Button onClick={linkEditMode ? handleUpdateLink : handleCreateLink} disabled={linkFormLoading}>
              {linkFormLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {linkEditMode ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão de Vínculo */}
      <Dialog open={linkDeleteModalOpen} onOpenChange={setLinkDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este vínculo de aprovação? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkDeleteModalOpen(false)} disabled={linkFormLoading}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteLink} disabled={linkFormLoading}>
              {linkFormLoading ? 'Excluindo...' : 'Excluir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Enviar para Sistema */}
      <Dialog open={sendToSystemModalOpen} onOpenChange={setSendToSystemModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Enviar para Sistema</DialogTitle>
            <DialogDescription>
              {selectedRequestsForAction.length === 1
                ? 'Confirmar envio da solicitação para o sistema da empresa?'
                : `Confirmar envio de ${selectedRequestsForAction.length} solicitações para o sistema da empresa?`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="system-notes" className="text-sm font-medium">
                Observações (opcional)
              </label>
              <Textarea
                id="system-notes"
                placeholder="Adicione observações sobre o envio..."
                rows={4}
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSendToSystemModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="default" onClick={handleConfirmSendToSystem}>
              Confirmar Envio
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
};

export default PaymentRequestsPage;

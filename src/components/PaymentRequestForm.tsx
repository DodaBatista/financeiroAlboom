import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { PaymentRequestPayload } from '@/services/paymentRequestService';
import { SearchableBankSelect } from '@/components/SearchableBankSelect';
import { useBanks } from '@/hooks/use-banks';

interface PaymentRequestFormProps {
  data: {
    requester: string;
    requesterEmail: string;
    department: string;
    paymentCompany: string;
    clientName: string;
    contractNumber: string;
    reason: string;
    paymentType: string;
    modality: string;
    expenseValue: string;
    dueDate: string;
    personType: 'fisica' | 'juridica';
    titular: string;
    cpfCnpj: string;
    bank: string;
    agency: string;
    account: string;
    pixType: string;
    pixKey: string;
  };
  onChange: (field: keyof PaymentRequestPayload | 'requester_email', value: string) => void;
  formatCpfCnpj: (value: string, type: 'fisica' | 'juridica') => string;
  formatCurrency: (value: string) => string;
  disabled?: boolean;
  isEditMode?: boolean;
}

const PaymentRequestForm: React.FC<PaymentRequestFormProps> = ({
  data,
  onChange,
  formatCpfCnpj,
  formatCurrency,
  disabled = false,
  isEditMode = false,
}) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Dados Gerais</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Solicitante</Label>
          <Input value={data.requester} disabled />
        </div>
        <div>
          <Label>E-mail do Solicitante</Label>
          <Input value={data.requesterEmail} disabled />
        </div>
        <div>
          <Label>Departamento</Label>
          <Select value={data.department} onValueChange={(value) => onChange('department', value)} disabled={disabled}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
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
        <div>
          <Label>Empresa de Pagamento</Label>
          <Select value={data.paymentCompany} onValueChange={(value) => onChange('payment_company', value)} disabled={disabled}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TAJ - Noivas">TAJ - Noivas</SelectItem>
              <SelectItem value="TAJ - Salão">TAJ - Salão</SelectItem>
              <SelectItem value="Estudio Produtora 7">Estudio Produtora 7</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Nome do Cliente</Label>
          <Input value={data.clientName} onChange={(e) => onChange('client_name', e.target.value)} disabled={disabled} />
        </div>
        <div>
          <Label>Nº do Contrato</Label>
          <Input
            type="number"
            value={data.contractNumber}
            onChange={(e) => onChange('contract_number', e.target.value.replace(/\D/g, ''))}
            disabled={disabled}
          />
        </div>
        <div className="md:col-span-2">
          <Label>Motivo da Despesa</Label>
          <Textarea value={data.reason} onChange={(e) => onChange('reason', e.target.value)} disabled={disabled} />
        </div>

        <div>
          <Label>Tipo de Pagamento</Label>
          <Select value={data.paymentType} onValueChange={(value) => onChange('payment_type', value)} disabled={disabled}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Normal">Normal</SelectItem>
              <SelectItem value="Especial">Especial</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Modalidade</Label>
          <Select value={data.modality} onValueChange={(value) => onChange('modality', value)} disabled={disabled}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Depósito">Depósito</SelectItem>
              <SelectItem value="Boleto">Boleto</SelectItem>
              <SelectItem value="Cheque">Cheque</SelectItem>
              <SelectItem value="Pix">Pix</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Valor da Despesa (R$)</Label>
          <Input
            value={data.expenseValue}
            onChange={(e) => {
              const onlyNumbers = e.target.value.replace(/\D/g, '');
              onChange('expense_value', formatCurrency(onlyNumbers));
            }}
            placeholder="0,00"
            disabled={disabled}
          />
        </div>

        <div>
          <Label>Data de Vencimento</Label>
          <Input
            type="date"
            value={data.dueDate}
            onChange={(e) => onChange('due_date', e.target.value)}
            disabled={disabled}
          />
        </div>
      </div>

      <h3 className="text-lg font-medium">Dados Bancários</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-center gap-4">
          <Label>Tipo Pessoa</Label>
          <RadioGroup
            value={data.personType}
            onValueChange={(v) => onChange('person_type', v)}
            className="flex flex-row gap-4 mt-2"
            disabled={disabled}
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem value="fisica" id="pf" disabled={disabled} />
              <Label htmlFor="pf">Física</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="juridica" id="pj" disabled={disabled} />
              <Label htmlFor="pj">Jurídica</Label>
            </div>
          </RadioGroup>
        </div>

        <div>
          <Label>Titular</Label>
          <Input value={data.titular} onChange={(e) => onChange('titular', e.target.value)} disabled={disabled} />
        </div>

        <div>
          <Label>CPF / CNPJ</Label>
          <Input
            value={data.cpfCnpj}
            onChange={(e) =>
              onChange('cpf_cnpj', formatCpfCnpj(e.target.value, data.personType))
            }
            placeholder={data.personType === 'fisica' ? '000.000.000-00' : '00.000.000/0000-00'}
            disabled={disabled}
          />
        </div>

        <div>
          <Label>Banco</Label>
          {isEditMode ? (
            <Input 
              value={data.bank} 
              onChange={(e) => onChange('bank', e.target.value)}
              disabled={disabled}
            />
          ) : (
            <SearchableBankSelect
              value={data.bank}
              onChange={(value) => onChange('bank', value)}
              {...useBanks()}
              disabled={disabled}
            />
          )}
        </div>

        <div>
          <Label>Agência</Label>
          <Input
            value={data.agency}
            onChange={(e) => onChange('agency', e.target.value.replace(/\D/g, ''))}
            disabled={disabled}
          />
        </div>

        <div>
          <Label>Conta Corrente</Label>
          <Input
            value={data.account}
            onChange={(e) => onChange('account', e.target.value.replace(/\D/g, ''))}
            disabled={disabled}
          />
        </div>

        {data.modality === 'Pix' && (
          <>
            <div>
              <Label>Tipo Pix</Label>
              <Select value={data.pixType} onValueChange={(value) => onChange('pix_type', value)} disabled={disabled}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="E-mail">E-mail</SelectItem>
                  <SelectItem value="Telefone">Telefone</SelectItem>
                  <SelectItem value="CPF/CNPJ">CPF/CNPJ</SelectItem>
                  <SelectItem value="Aleatoria">Aleatória</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Chave Pix</Label>
              <Input value={data.pixKey} onChange={(e) => onChange('pix_key', e.target.value)} disabled={disabled} />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentRequestForm;
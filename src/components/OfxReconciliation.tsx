import { useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { bankService } from '@/services/bankService';
import { getAvailableTitles } from '@/services/titleService';
import { callAPIN8N } from '@/utils/api';
import { OfxMatchSuggestion, suggestTitleMatches } from '@/utils/ofxMatching';
import { parseOfxTransactions } from '@/utils/ofxParser';
import { Loader2, Upload } from 'lucide-react';

interface Bank {
  id: string;
  name: string;
  account_code: string;
  active: string;
}

interface OfxReconciliationProps {
  type: 'ap' | 'ar';
  onBaixaConfirmada?: () => void;
}

const formatCurrency = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export function OfxReconciliation({ type, onBaixaConfirmada }: OfxReconciliationProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fileName, setFileName] = useState('');
  const [parsing, setParsing] = useState(false);
  const [suggestions, setSuggestions] = useState<OfxMatchSuggestion[]>([]);
  const [confirmedIndexes, setConfirmedIndexes] = useState<Set<number>>(new Set());

  const [banks, setBanks] = useState<Bank[]>([]);
  const [selectedBank, setSelectedBank] = useState('');
  const [banksLoading, setBanksLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const loadBanks = async () => {
    if (banks.length > 0) return;
    setBanksLoading(true);
    try {
      const result = await bankService.fetchBanks();
      setBanks(result);
    } catch {
      toast({ title: 'Erro ao carregar bancos', variant: 'destructive' });
    } finally {
      setBanksLoading(false);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setParsing(true);
    setSuggestions([]);
    setConfirmedIndexes(new Set());
    await loadBanks();

    try {
      const text = await file.text();
      const transactions = parseOfxTransactions(text);

      if (transactions.length === 0) {
        toast({
          title: 'Nenhuma transação encontrada',
          description: 'Confira se o arquivo é um OFX válido.',
          variant: 'destructive',
        });
        setParsing(false);
        return;
      }

      const dates = transactions.map((t) => t.datePosted).sort();
      const minDate = new Date(dates[0]);
      const maxDate = new Date(dates[dates.length - 1]);
      minDate.setDate(minDate.getDate() - 5);
      maxDate.setDate(maxDate.getDate() + 5);
      const toIso = (d: Date) => d.toISOString().slice(0, 10);

      const { titulos } = await getAvailableTitles({
        type,
        class_id: 'all',
        doc_type: 'all',
        customer_id: null,
        pageNumber: 1,
        pageSize: 999999,
        groupBy: null,
        sortBy: 'account_trans.due_date',
        sortDir: 'DESC',
        searchTerm: '',
        period: 'other',
        start_date: toIso(minDate),
        end_date: toIso(maxDate),
        csv_mode: 0,
      });

      const matches = suggestTitleMatches(transactions, titulos);
      setSuggestions(matches);
      setConfirmedIndexes(
        new Set(matches.map((m, i) => (m.matchedTitles.length > 0 ? i : -1)).filter((i) => i >= 0))
      );
    } catch (error) {
      console.error('Erro ao processar OFX:', error);
      toast({ title: 'Erro ao processar o arquivo OFX', variant: 'destructive' });
    } finally {
      setParsing(false);
    }
  };

  const toggleConfirmed = (index: number) => {
    setConfirmedIndexes((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const handleConfirmBaixas = async () => {
    if (!selectedBank) {
      toast({ title: 'Selecione o banco/conta do extrato', variant: 'destructive' });
      return;
    }

    const toProcess = suggestions.filter((s, i) => confirmedIndexes.has(i) && s.matchedTitles.length > 0);
    if (toProcess.length === 0) {
      toast({ title: 'Nenhum match confirmado para baixar', variant: 'destructive' });
      return;
    }

    setConfirming(true);
    try {
      const payload = toProcess.flatMap(({ transaction, matchedTitles }) =>
        matchedTitles.map((matchedTitle) => ({
          id_titulo: matchedTitle.id,
          dt_payment: transaction.datePosted,
          account_code: selectedBank,
          memo: matchedTitle.memo || transaction.memo || '',
        }))
      );

      await callAPIN8N(null, { Titulo: payload, type }, 'finance/clear_accounts');

      toast({
        title: 'Baixa enviada',
        description: `${toProcess.length} título(s) enviados para baixa a partir do OFX.`,
      });

      setSuggestions([]);
      setConfirmedIndexes(new Set());
      setFileName('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      onBaixaConfirmada?.();
    } catch (error) {
      console.error('Erro ao confirmar baixas via OFX:', error);
      toast({ title: 'Erro ao processar a baixa', variant: 'destructive' });
    } finally {
      setConfirming(false);
    }
  };

  const matchedCount = suggestions.filter((s) => s.matchedTitles.length > 0).length;

  const matchMethodLabel: Record<string, string> = {
    unique: 'valor + data',
    document: 'CPF/CNPJ',
    name: 'nome',
    group_sum: 'soma de títulos',
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Importar extrato OFX</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Arquivo OFX</label>
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".ofx"
                onChange={handleFileChange}
                className="hidden"
                id={`ofx-input-${type}`}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={parsing}
              >
                {parsing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                {fileName || 'Selecionar arquivo .ofx'}
              </Button>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Banco (conta do extrato) *</label>
            <Select value={selectedBank} onValueChange={setSelectedBank} onOpenChange={loadBanks}>
              <SelectTrigger className="w-[240px]">
                <SelectValue placeholder={banksLoading ? 'Carregando...' : 'Selecione um banco'} />
              </SelectTrigger>
              <SelectContent>
                {banks.map((bank) => (
                  <SelectItem key={bank.id} value={bank.account_code}>
                    {bank.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {suggestions.length > 0 && (
          <>
            <div className="text-sm text-muted-foreground">
              {matchedCount} de {suggestions.length} transações encontraram título correspondente. O critério
              combina valor + data, CPF/CNPJ e nome do favorecido extraídos do memo do extrato, e soma de
              títulos quando um único pagamento cobre mais de uma nota. Revise antes de confirmar.
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10" />
                    <TableHead>Data extrato</TableHead>
                    <TableHead>Valor extrato</TableHead>
                    <TableHead>Memo extrato</TableHead>
                    <TableHead>Título(s) sugerido(s)</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Valor título(s)</TableHead>
                    <TableHead>Critério</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {suggestions.map((suggestion, index) => {
                    const { matchedTitles } = suggestion;
                    const hasMatch = matchedTitles.length > 0;
                    const totalAmount = matchedTitles.reduce((sum, t) => sum + parseFloat(t.amount), 0);

                    return (
                      <TableRow key={`${suggestion.transaction.fitid}-${index}`}>
                        <TableCell>
                          <Checkbox
                            checked={confirmedIndexes.has(index)}
                            disabled={!hasMatch}
                            onCheckedChange={() => toggleConfirmed(index)}
                          />
                        </TableCell>
                        <TableCell>{suggestion.transaction.datePosted}</TableCell>
                        <TableCell>{formatCurrency(Math.abs(suggestion.transaction.amount))}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{suggestion.transaction.memo}</TableCell>
                        <TableCell>
                          {hasMatch ? (
                            <div className="space-y-1">
                              {matchedTitles.map((t) => (
                                <div key={t.id}>
                                  {`${t.customer_name} ${t.customer_lastname || ''}`.trim()}
                                  {matchedTitles.length > 1 && (
                                    <span className="text-muted-foreground"> ({formatCurrency(parseFloat(t.amount))})</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <Badge variant="outline">Sem match</Badge>
                          )}
                        </TableCell>
                        <TableCell>{matchedTitles[0]?.due_date || '-'}</TableCell>
                        <TableCell>{hasMatch ? formatCurrency(totalAmount) : '-'}</TableCell>
                        <TableCell>
                          {suggestion.matchMethod ? (
                            <Badge variant="secondary">{matchMethodLabel[suggestion.matchMethod]}</Badge>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            <Button onClick={handleConfirmBaixas} disabled={confirming || confirmedIndexes.size === 0}>
              {confirming && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirmar baixa dos selecionados ({confirmedIndexes.size})
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

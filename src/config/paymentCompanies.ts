/**
 * Fonte única das empresas de pagamento ("payment_company") usadas em Solicitação de Pagamento.
 * Antes, `PaymentRequestForm.tsx` tinha uma lista hardcoded diferente da usada em
 * `PaymentRequestsPage.tsx` (faltava "P7 Filmes" e sobrava "TAJ - Salão", que não tem
 * correspondência no banco) — esse arquivo unifica as duas.
 */
export interface PaymentCompanyOption {
  /** Valor salvo no banco (payment_requests.payment_company). */
  dbValue: string;
  /** Rótulo exibido no formulário/filtros. */
  label: string;
}

export const PAYMENT_COMPANIES: PaymentCompanyOption[] = [
  { dbValue: 'Taj_Noivas', label: 'TAJ - Noivas' },
  { dbValue: 'Produtora_7', label: 'Estudio Produtora 7' },
  { dbValue: 'P7_Filmes', label: 'P7 Filmes' },
];

export const paymentCompanyDbToLabel = (dbValue: string): string => {
  return PAYMENT_COMPANIES.find((c) => c.dbValue === dbValue)?.label || dbValue;
};

export const paymentCompanyLabelToDb = (label: string): string => {
  return PAYMENT_COMPANIES.find((c) => c.label === label)?.dbValue || label;
};

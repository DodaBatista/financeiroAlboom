import { Title } from '@/services/titleService';
import { OfxTransaction } from '@/utils/ofxParser';

export type MatchMethod = 'unique' | 'document' | 'name' | 'group_sum';

export interface OfxMatchSuggestion {
  transaction: OfxTransaction;
  /** 0 títulos = sem match; 1 = match normal; 2+ = um único pagamento cobrindo vários títulos. */
  matchedTitles: Title[];
  matchMethod: MatchMethod | null;
}

/**
 * Tolerância de dias entre a data do lançamento no extrato e o vencimento do título.
 */
const DATE_TOLERANCE_DAYS = 3;

const dateDiffInDays = (a: string, b: string): number => {
  const diffMs = Math.abs(new Date(a).getTime() - new Date(b).getTime());
  return diffMs / (1000 * 60 * 60 * 24);
};

const sameAmount = (a: number, b: number): boolean => Math.abs(a - b) <= 0.01;

/** Remove tudo que não é dígito — usado pra comparar CPF/CNPJ ignorando pontuação. */
const onlyDigits = (value?: string | null): string => (value || '').replace(/\D/g, '');

/** Extrai todas as sequências de CPF/CNPJ (11 ou 14 dígitos) presentes no memo do lançamento do OFX. */
const extractDocuments = (memo: string): Set<string> => {
  const matches = memo.match(/[\d][\d.\-/]{9,18}[\d]/g) || [];
  const docs = matches.map(onlyDigits).filter((d) => d.length === 11 || d.length === 14);
  return new Set(docs);
};

/** Maiúsculas, sem acento, só letras/espaços — pra comparar nomes ignorando formatação. */
const normalizeName = (value?: string | null): string =>
  (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const NAME_STOPWORDS = new Set(['DE', 'DA', 'DO', 'DOS', 'DAS', 'E']);

/** Considera "nome bate" quando a maioria das palavras relevantes do nome do título aparece no memo do OFX. */
const nameMatchesMemo = (title: Title, normalizedMemo: string): boolean => {
  const fullName = normalizeName(`${title.customer_name} ${title.customer_lastname || ''}`);
  const words = fullName.split(' ').filter((w) => w.length >= 3 && !NAME_STOPWORDS.has(w));
  if (words.length === 0) return false;

  const hits = words.filter((w) => normalizedMemo.includes(w)).length;
  return hits >= Math.max(1, Math.ceil(words.length * 0.6));
};

/**
 * Sugere, para cada transação do OFX, o(s) título(s) em aberto mais provável(is). Estratégia em
 * camadas, da mais confiável pra mais frágil:
 *
 * 1. Valor exato + vencimento dentro da tolerância, com um único candidato → match direto.
 * 2. Se houver mais de um candidato com mesmo valor/data (ambíguo), desempata por CPF/CNPJ
 *    extraído do memo do OFX (comparado com `customer_cpf`) e, se ainda ambíguo, pelo nome do
 *    favorecido presente no memo.
 * 3. Se nenhum título bate sozinho com o valor da transação, tenta achar um grupo de títulos do
 *    mesmo favorecido (por CPF/CNPJ ou nome) com vencimento próximo cuja soma bate exatamente com
 *    o valor do OFX — cobre o caso comum de um único PIX pagando duas ou mais notas juntas.
 *
 * Quando nada disso resolve de forma inequívoca, `matchedTitles` fica vazio — cabe revisão manual.
 * Cada título só é sugerido para uma transação por vez.
 */
export const suggestTitleMatches = (
  transactions: OfxTransaction[],
  titles: Title[]
): OfxMatchSuggestion[] => {
  const usedTitleIds = new Set<string>();

  const closestByDate = (candidates: Title[], transactionDate: string): Title[] => {
    if (candidates.length <= 1) return candidates;
    return [...candidates].sort(
      (a, b) => dateDiffInDays(a.due_date, transactionDate) - dateDiffInDays(b.due_date, transactionDate)
    );
  };

  return transactions.map((transaction) => {
    const absAmount = Math.abs(transaction.amount);
    const memoDocs = extractDocuments(transaction.memo);
    const normalizedMemo = normalizeName(transaction.memo);

    const available = titles.filter((t) => !usedTitleIds.has(t.id));

    const byAmountAndDate = available.filter((t) => {
      if (!sameAmount(parseFloat(t.amount), absAmount)) return false;
      return dateDiffInDays(t.due_date, transaction.datePosted) <= DATE_TOLERANCE_DAYS;
    });

    const commit = (result: Title[], matchMethod: MatchMethod): OfxMatchSuggestion => {
      result.forEach((t) => usedTitleIds.add(t.id));
      return { transaction, matchedTitles: result, matchMethod };
    };

    if (byAmountAndDate.length === 1) {
      return commit(byAmountAndDate, 'unique');
    }

    if (byAmountAndDate.length > 1) {
      const byDocument = byAmountAndDate.filter(
        (t) => t.customer_cpf && memoDocs.has(onlyDigits(t.customer_cpf))
      );
      if (byDocument.length === 1) {
        return commit(byDocument, 'document');
      }

      const byName = byAmountAndDate.filter((t) => nameMatchesMemo(t, normalizedMemo));
      if (byName.length === 1) {
        return commit(byName, 'name');
      }

      // Ambíguo mesmo depois do desempate — melhor pedir revisão manual do que arriscar título errado.
      return { transaction, matchedTitles: [], matchMethod: null };
    }

    // Nenhum título com valor idêntico: tenta achar um grupo (mesmo favorecido) cuja soma bate.
    const sameCustomerCandidates = available.filter((t) => {
      if (dateDiffInDays(t.due_date, transaction.datePosted) > DATE_TOLERANCE_DAYS) return false;
      const matchesDocument = !!t.customer_cpf && memoDocs.has(onlyDigits(t.customer_cpf));
      const matchesName = nameMatchesMemo(t, normalizedMemo);
      return matchesDocument || matchesName;
    });

    if (sameCustomerCandidates.length >= 2) {
      const total = sameCustomerCandidates.reduce((sum, t) => sum + parseFloat(t.amount), 0);
      if (sameAmount(total, absAmount)) {
        return commit(closestByDate(sameCustomerCandidates, transaction.datePosted), 'group_sum');
      }
    }

    return { transaction, matchedTitles: [], matchMethod: null };
  });
};

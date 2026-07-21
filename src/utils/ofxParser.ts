export interface OfxTransaction {
  fitid: string;
  type: string;
  /** ISO YYYY-MM-DD */
  datePosted: string;
  amount: number;
  memo: string;
  checkNumber?: string;
}

const extractTag = (block: string, tag: string): string | undefined => {
  const match = block.match(new RegExp(`<${tag}>([^<\r\n]*)`, 'i'));
  return match ? match[1].trim() : undefined;
};

/** OFX usa datas no formato YYYYMMDDHHMMSS[+-offset[:TZ]]; interessa só a parte YYYYMMDD. */
const parseOfxDate = (raw?: string): string => {
  if (!raw || raw.length < 8) return '';
  const year = raw.slice(0, 4);
  const month = raw.slice(4, 6);
  const day = raw.slice(6, 8);
  return `${year}-${month}-${day}`;
};

/**
 * Parser minimalista de OFX (SGML/XML), sem dependências externas (nenhuma lib de OFX/CSV
 * existia no projeto). Extrai só os campos necessários para a conciliação: FITID, TRNTYPE,
 * DTPOSTED, TRNAMT, MEMO/NAME, CHECKNUM.
 */
export const parseOfxTransactions = (ofxContent: string): OfxTransaction[] => {
  const blocks = ofxContent.match(/<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi) || [];

  return blocks
    .map((block) => {
      const datePosted = parseOfxDate(extractTag(block, 'DTPOSTED'));
      const amountRaw = (extractTag(block, 'TRNAMT') || '').replace(',', '.');
      const amount = parseFloat(amountRaw);

      return {
        fitid: extractTag(block, 'FITID') || '',
        type: extractTag(block, 'TRNTYPE') || '',
        datePosted,
        amount,
        memo: extractTag(block, 'MEMO') || extractTag(block, 'NAME') || '',
        checkNumber: extractTag(block, 'CHECKNUM'),
      };
    })
    .filter((tx) => tx.datePosted && !isNaN(tx.amount));
};

interface CompanyMapping {
  [key: string]: string;
}

/**
 * Mapeia subdomínio/segmento de URL -> código interno da empresa. Só é relevante para deployments
 * que usam subdomínio/path por empresa (ex: `p7.exemplo.com`) — a instalação em produção roda num
 * domínio único (`financeiro.risystems.online`) sem subdomínio, então `getCompanyFromUrl()` na
 * prática nunca bate aqui e cai no fallback `produtora7`. A escolha real de empresa acontece na
 * tela de login (`Login.tsx`), via seletor alimentado por `useCompanies()`
 * (`src/hooks/use-companies.ts`, lido de `system_companies/list` na tabela `auth` do n8n) — esse
 * mapa só serve de fallback pra telas que ainda não têm o `empresa` do usuário logado disponível.
 */
const COMPANY_MAPPINGS: CompanyMapping = {
  'p7': 'produtora7',
  'espacoterra': 'espacoterra',
};

export const getCompanyFromUrl = (): string => {
  const hostname = window.location.hostname;
  const pathname = window.location.pathname;
  
  const subdomain = hostname.split('.')[0];
  if (COMPANY_MAPPINGS[subdomain]) {
    return COMPANY_MAPPINGS[subdomain];
  }
  
  const pathSegments = pathname.split('/').filter(Boolean);
  if (pathSegments.length > 0) {
    const firstSegment = pathSegments[0];
    if (COMPANY_MAPPINGS[firstSegment]) {
      return COMPANY_MAPPINGS[firstSegment];
    }
  }
  
  return 'produtora7';
};

/** Fallback estático usado antes do login (Login.tsx) ou enquanto `useCompanies()` ainda carrega. */
export const getCompanyDisplayName = (companyCode: string): string => {
  const displayNames: CompanyMapping = {
    'produtora7': 'Produtora 7',
    'espacoterra': 'Espaço Terra',
  };

  return displayNames[companyCode] || companyCode;
};
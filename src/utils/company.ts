interface CompanyMapping {
  [key: string]: string;
}

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

export const getCompanyDisplayName = (companyCode: string): string => {
  const displayNames: CompanyMapping = {
    'p7': 'Produtora 7',
    'espacoterra': 'Espaço Terra',
  };
  
  return displayNames[companyCode] || companyCode;
};
/**
 * Utility functions for extracting company information from URL
 */

interface CompanyMapping {
  [key: string]: string;
}

// Mapping of URL identifiers to company names
const COMPANY_MAPPINGS: CompanyMapping = {
  'p7': 'produtora7',
  'produtora7': 'produtora7',
  'espacoterra': 'espacoterra',
  'tajmahal': 'tajmahal',
  // Add more mappings as needed
};

/**
 * Extract company identifier from current URL
 * Supports both subdomain (p7.example.com) and path (/p7/accounts) patterns
 */
export const getCompanyFromUrl = (): string => {
  const hostname = window.location.hostname;
  const pathname = window.location.pathname;
  
  // Check subdomain first (e.g., p7.lovableproject.com)
  const subdomain = hostname.split('.')[0];
  if (COMPANY_MAPPINGS[subdomain]) {
    return COMPANY_MAPPINGS[subdomain];
  }
  
  // Check path segments (e.g., /p7/accounts-payable)
  const pathSegments = pathname.split('/').filter(Boolean);
  if (pathSegments.length > 0) {
    const firstSegment = pathSegments[0];
    if (COMPANY_MAPPINGS[firstSegment]) {
      return COMPANY_MAPPINGS[firstSegment];
    }
  }
  
  // Default fallback
  return 'produtora7';
};

/**
 * Get company display name for UI
 */
export const getCompanyDisplayName = (companyCode: string): string => {
  const displayNames: CompanyMapping = {
    'produtora7': 'Produtora 7',
    'espacoterra': 'Espaço Terra',
    'tajmahal': 'Taj Mahal',
  };
  
  return displayNames[companyCode] || companyCode;
};
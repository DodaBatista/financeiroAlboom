import { useEffect, useState } from 'react';
import { fetchSystemCompanies } from '@/services/systemCompanyService';
import { getCompanyDisplayName as getStaticDisplayName } from '@/utils/company';

export interface CompanyOption {
  empresa: string;
  displayName: string;
}

/**
 * Lista de empresas dinâmica, lida direto de `system_companies/list` (tabela `auth` no n8n).
 * Cadastrar uma empresa nova em /admin/empresas-sistema faz ela aparecer aqui automaticamente,
 * sem precisar editar código (ver Fase C do plano em docs/n8n-contrato-permissoes.md).
 */
export function useCompanies() {
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchSystemCompanies()
      .then((res) => {
        if (!mounted) return;
        const options = (res.data || []).map((c) => ({
          empresa: c.empresa,
          displayName: c.display_name || getStaticDisplayName(c.empresa),
        }));
        setCompanies(options);
      })
      .catch((err) => {
        console.warn('Erro ao buscar empresas', err);
      })
      .finally(() => { if (mounted) setLoading(false); });

    return () => { mounted = false; };
  }, []);

  const getDisplayName = (empresa: string): string => {
    const found = companies.find((c) => c.empresa === empresa);
    return found?.displayName || getStaticDisplayName(empresa);
  };

  return { companies, loading, getDisplayName };
}

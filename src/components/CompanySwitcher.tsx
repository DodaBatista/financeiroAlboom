import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useCompanies } from '@/hooks/use-companies';

/** Visível só para usuários com acesso liberado a mais de uma empresa (ver Fase B do plano). */
export function CompanySwitcher() {
  const { user, activeEmpresa, switchCompany } = useAuth();
  const { companies, getDisplayName } = useCompanies();

  if (!user) {
    return null;
  }

  // `useCompanies()` só traz empresas ativas neste sistema — filtra vínculos antigos que
  // apontem pra uma empresa desativada (ex: cliente que usa a Alboom mas não este sistema).
  const activeEmpresaCodes = new Set(companies.map((c) => c.empresa));
  const selectableCompanies = user.allowedCompanies.filter((empresa) => activeEmpresaCodes.has(empresa));

  if (selectableCompanies.length <= 1) {
    return null;
  }

  return (
    <Select value={activeEmpresa || user.homeEmpresa} onValueChange={switchCompany}>
      <SelectTrigger className="w-[180px] h-9">
        <SelectValue placeholder="Empresa" />
      </SelectTrigger>
      <SelectContent>
        {selectableCompanies.map((empresa) => (
          <SelectItem key={empresa} value={empresa}>
            {getDisplayName(empresa)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

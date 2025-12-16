import { useEffect, useState } from 'react';
import axios from 'axios';

interface BankItem {
  ispb: string;
  name: string;
  code: number;
  fullName: string;
}

export interface BankOption {
  value: string; // ${code} - ${name}
  code: number;
  name: string;
  fullName: string;
}

export function useBanks() {
  const [banks, setBanks] = useState<BankOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    axios.get<BankItem[]>('https://brasilapi.com.br/api/banks/v1')
      .then((res) => {
        if (!mounted) return;
        const options: BankOption[] = (res.data || [])
          .filter((b) => b.code !== null && b.code !== undefined) // Filtra bancos sem código
          .map((b) => {
            // Converte o código para string e adiciona zeros à esquerda até ter 3 dígitos
            const formattedCode = String(b.code).padStart(3, '0');
            return {
              value: `${formattedCode} - ${b.name}`,
              code: b.code,
              name: b.name,
              fullName: b.fullName,
            };
          });
        setBanks(options);
      })
      .catch((err) => {
        console.warn('Erro ao buscar bancos', err);
        setError('Erro ao buscar bancos');
      })
      .finally(() => { if (mounted) setLoading(false); });

    return () => { mounted = false; };
  }, []);

  return { banks, loading, error };
}
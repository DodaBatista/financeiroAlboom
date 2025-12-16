import React, { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { BankOption } from '@/hooks/use-banks';

export const SearchableBankSelect: React.FC<{
  value?: string;
  onChange: (value: string) => void;
  banks: BankOption[];
  isLoading?: boolean;
  error?: string | null;
}> = ({ value, onChange, banks, isLoading, error }) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return banks;
    return banks.filter(b => {
      // Formata o código do banco com zeros à esquerda para busca
      const formattedCode = String(b.code).padStart(3, '0');
      const searchText = `${formattedCode} ${b.code} ${b.name} ${b.fullName}`.toLowerCase();
      return searchText.includes(q);
    });
  }, [query, banks]);

  if (error) {
    return <div className="text-sm text-destructive">{error}</div>;
  }

  return (
    <div className="relative">
      <Input
        placeholder="Buscar banco por código ou nome"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onClick={() => setIsOpen(true)}
        disabled={isLoading}
      />
      
      {isLoading && (
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      )}
      
      {isOpen && !isLoading && (
        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md max-h-60 overflow-auto">
          <div className="p-1">
            {filtered.map((bank) => (
              <Button
                key={bank.value}
                variant="ghost"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  value === bank.value && "bg-accent"
                )}
                onClick={() => {
                  onChange(bank.value);
                  setIsOpen(false);
                  setQuery('');
                }}
              >
                {bank.value}
              </Button>
            ))}
            {filtered.length === 0 && (
              <div className="p-2 text-sm text-muted-foreground">
                Nenhum banco encontrado
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
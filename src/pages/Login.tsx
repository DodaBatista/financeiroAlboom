import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { getCompanyDisplayName, getCompanyFromUrl } from '@/utils/company';
import { Loader2, LogIn } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [username, setUsername] = useState('douglasbatista@relatoriosinteligentes.com');
  const [password, setPassword] = useState('654321');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const companyDisplay = getCompanyDisplayName(getCompanyFromUrl());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(username, password);
      toast({
        title: "Login realizado com sucesso",
        description: `Bem-vindo ao sistema ${companyDisplay}!`,
      });
      navigate('/');
    } catch (error) {
      toast({
        title: "Erro no login",
        description: (error as Error)?.message || "Usuário ou senha incorretos.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 to-background p-4">
      <Card className="w-full max-w-md shadow-financial">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Sistema Financeiro
          </CardTitle>
          <p className="text-muted-foreground">
            {companyDisplay} - Faça login para acessar o sistema
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Usuário</Label>
              <Input
                id="username"
                type="text"
                placeholder="Digite seu usuário"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="Digite sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button 
              type="submit" 
              className="w-full shadow-button" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" />
                  Entrar
                </>
              )}
            </Button>
          </form>
          <div className="mt-4 p-3 bg-muted rounded-md">
            <p className="text-sm text-muted-foreground text-center">
              <strong>Empresa:</strong> {companyDisplay}<br />
              Entre com suas credenciais para acessar o sistema
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
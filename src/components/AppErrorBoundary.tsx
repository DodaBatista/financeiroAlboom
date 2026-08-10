import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Rede de segurança pra erros de render que travam a tela inteira em branco (ex: bundle
 * desatualizado em cache no navegador do usuário, apontando pra um chunk JS que não bate mais
 * com o restante do app publicado). Em vez de tela branca sem explicação, mostra uma mensagem
 * e recarrega a página automaticamente uma vez — cobre exatamente esse caso (o reload busca a
 * `index.html` atual, que via `vercel.json` nunca fica em cache do navegador).
 */
export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Erro não tratado na aplicação:', error, info);

    // Se ainda não tentamos recarregar nesta sessão do navegador, tenta uma vez — cobre o caso
    // comum de cache desatualizado. Evita loop infinito com uma flag em sessionStorage.
    if (!sessionStorage.getItem('app-error-reload-attempted')) {
      sessionStorage.setItem('app-error-reload-attempted', '1');
      window.location.reload();
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="max-w-md text-center space-y-4">
            <h1 className="text-xl font-semibold">Ops, algo deu errado</h1>
            <p className="text-muted-foreground text-sm">
              Estamos recarregando a página automaticamente. Se a tela continuar em branco,
              atualize manualmente (Ctrl+F5 / Cmd+Shift+R) para limpar o cache do navegador.
            </p>
            <button
              className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium"
              onClick={() => window.location.reload()}
            >
              Recarregar agora
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

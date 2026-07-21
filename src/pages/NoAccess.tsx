import { useAuth } from "@/contexts/AuthContext";

const NoAccess = () => {
  const { logout } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center max-w-md px-4">
        <h1 className="text-4xl font-bold mb-4">Sem acesso</h1>
        <p className="text-gray-600 mb-6">
          Seu usuário ainda não tem nenhuma página liberada. Fale com um administrador para
          liberar o acesso.
        </p>
        <button
          onClick={logout}
          className="text-blue-500 hover:text-blue-700 underline"
        >
          Sair
        </button>
      </div>
    </div>
  );
};

export default NoAccess;

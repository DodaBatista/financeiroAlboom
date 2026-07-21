import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { APP_PAGES } from '@/config/pages';
import { PageKey } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useCompanies } from '@/hooks/use-companies';
import {
  AlboomUserResult,
  AppUser,
  fetchAppUsers,
  searchAlboomUsers,
  upsertAppUser,
} from '@/services/userManagementService';

const emptyForm = {
  id: undefined as string | undefined,
  alboom_user_id: '',
  home_empresa: '',
  name: '',
  email: '',
  is_admin: false,
  allowed_pages: [] as PageKey[],
  companies: [] as string[],
};

export default function AdminUsersPage() {
  const { toast } = useToast();
  const { companies: knownCompanies, getDisplayName } = useCompanies();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const [alboomSearchTerm, setAlboomSearchTerm] = useState('');
  const [alboomResults, setAlboomResults] = useState<AlboomUserResult[]>([]);
  const [searchingAlboom, setSearchingAlboom] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await fetchAppUsers({ empresa: 'all' });
      setUsers(response.data);
    } catch (error) {
      toast({ title: 'Erro ao carregar usuários', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openEdit = (user?: AppUser) => {
    if (user) {
      setForm({
        id: user.id,
        alboom_user_id: user.alboom_user_id,
        home_empresa: user.home_empresa,
        name: user.name,
        email: user.email,
        is_admin: user.is_admin,
        allowed_pages: user.allowed_pages || [],
        companies: user.companies || [],
      });
    } else {
      setForm({ ...emptyForm, home_empresa: knownCompanies[0]?.empresa || '' });
    }
    setAlboomSearchTerm('');
    setAlboomResults([]);
    setDialogOpen(true);
  };

  const handleSearchAlboom = async () => {
    if (!alboomSearchTerm.trim()) return;
    setSearchingAlboom(true);
    try {
      const results = await searchAlboomUsers(form.home_empresa, alboomSearchTerm.trim());
      setAlboomResults(results);
    } catch (error) {
      toast({ title: 'Erro ao buscar usuários no Alboom', variant: 'destructive' });
    } finally {
      setSearchingAlboom(false);
    }
  };

  const selectAlboomUser = (result: AlboomUserResult) => {
    setForm((prev) => ({
      ...prev,
      alboom_user_id: result.alboom_user_id,
      name: result.name,
      email: result.email,
    }));
    setAlboomResults([]);
  };

  const togglePage = (page: PageKey) => {
    setForm((prev) => ({
      ...prev,
      allowed_pages: prev.allowed_pages.includes(page)
        ? prev.allowed_pages.filter((p) => p !== page)
        : [...prev.allowed_pages, page],
    }));
  };

  const toggleCompany = (empresa: string) => {
    setForm((prev) => ({
      ...prev,
      companies: prev.companies.includes(empresa)
        ? prev.companies.filter((c) => c !== empresa)
        : [...prev.companies, empresa],
    }));
  };

  const handleSave = async () => {
    if (!form.alboom_user_id || !form.home_empresa) {
      toast({ title: 'Selecione um usuário do Alboom antes de salvar', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      await upsertAppUser({
        id: form.id,
        alboom_user_id: form.alboom_user_id,
        home_empresa: form.home_empresa,
        name: form.name,
        email: form.email,
        is_admin: form.is_admin,
        allowed_pages: form.allowed_pages,
        companies: form.companies.length ? form.companies : [form.home_empresa],
      });
      toast({ title: 'Usuário salvo com sucesso' });
      setDialogOpen(false);
      loadUsers();
    } catch (error) {
      toast({ title: 'Erro ao salvar usuário', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Administração de Usuários</h1>
        <Button onClick={() => openEdit()}>Novo acesso</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Usuários com acesso liberado</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Empresa (login)</TableHead>
                <TableHead>Páginas</TableHead>
                <TableHead>Empresas liberadas</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.name}{user.is_admin && <Badge className="ml-2">Admin</Badge>}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{getDisplayName(user.home_empresa)}</TableCell>
                  <TableCell className="space-x-1">
                    {user.allowed_pages?.length
                      ? user.allowed_pages.map((page) => (
                          <Badge key={page} variant="secondary">
                            {APP_PAGES.find((p) => p.key === page)?.title || page}
                          </Badge>
                        ))
                      : <span className="text-muted-foreground text-sm">Nenhuma</span>}
                  </TableCell>
                  <TableCell className="space-x-1">
                    {(user.companies || []).map((empresa) => (
                      <Badge key={empresa} variant="outline">
                        {getDisplayName(empresa)}
                      </Badge>
                    ))}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => openEdit(user)}>
                      Editar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {!loading && users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Nenhum usuário cadastrado ainda.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form.id ? 'Editar acesso' : 'Novo acesso'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Empresa (onde o usuário faz login)</Label>
              <select
                className="w-full border rounded-md h-10 px-3 mt-1"
                value={form.home_empresa}
                onChange={(e) => setForm((prev) => ({ ...prev, home_empresa: e.target.value }))}
                disabled={!!form.id}
              >
                {knownCompanies.map(({ empresa, displayName }) => (
                  <option key={empresa} value={empresa}>
                    {displayName}
                  </option>
                ))}
              </select>
            </div>

            {!form.id && (
              <div>
                <Label>Buscar usuário no Alboom</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={alboomSearchTerm}
                    onChange={(e) => setAlboomSearchTerm(e.target.value)}
                    placeholder="Nome ou email"
                  />
                  <Button type="button" onClick={handleSearchAlboom} disabled={searchingAlboom}>
                    Buscar
                  </Button>
                </div>
                {alboomResults.length > 0 && (
                  <div className="border rounded-md mt-2 max-h-40 overflow-y-auto">
                    {alboomResults.map((result) => (
                      <button
                        key={result.alboom_user_id}
                        type="button"
                        className="w-full text-left px-3 py-2 hover:bg-muted text-sm"
                        onClick={() => selectAlboomUser(result)}
                      >
                        {result.name} — {result.email}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {form.alboom_user_id && (
              <div className="text-sm text-muted-foreground">
                Selecionado: <strong>{form.name}</strong> ({form.email})
              </div>
            )}

            <div className="flex items-center gap-2">
              <Checkbox
                id="is_admin"
                checked={form.is_admin}
                onCheckedChange={(checked) => setForm((prev) => ({ ...prev, is_admin: !!checked }))}
              />
              <Label htmlFor="is_admin">Administrador (acesso total + gerencia usuários)</Label>
            </div>

            <div>
              <Label>Páginas liberadas</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {APP_PAGES.map((page) => (
                  <div key={page.key} className="flex items-center gap-2">
                    <Checkbox
                      id={`page-${page.key}`}
                      checked={form.allowed_pages.includes(page.key)}
                      onCheckedChange={() => togglePage(page.key)}
                    />
                    <Label htmlFor={`page-${page.key}`}>{page.title}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label>Empresas liberadas (além da empresa de login)</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {knownCompanies.map(({ empresa, displayName }) => (
                  <div key={empresa} className="flex items-center gap-2">
                    <Checkbox
                      id={`company-${empresa}`}
                      checked={form.companies.includes(empresa)}
                      onCheckedChange={() => toggleCompany(empresa)}
                    />
                    <Label htmlFor={`company-${empresa}`}>{displayName}</Label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

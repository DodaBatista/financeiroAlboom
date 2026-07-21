import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import {
  SystemCompany,
  deleteSystemCompany,
  fetchSystemCompanies,
  upsertSystemCompany,
} from '@/services/systemCompanyService';

const emptyForm = {
  id: undefined as string | undefined,
  empresa: '',
  display_name: '',
  username: '',
  password: '',
  form_html: '',
  active: true,
};

export default function AdminSystemCompaniesPage() {
  const { toast } = useToast();
  const [companies, setCompanies] = useState<SystemCompany[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<SystemCompany | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadCompanies = async () => {
    setLoading(true);
    try {
      const response = await fetchSystemCompanies({ includeInactive: true });
      setCompanies(response.data);
    } catch (error) {
      toast({ title: 'Erro ao carregar empresas', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompanies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openEdit = (company?: SystemCompany) => {
    if (company) {
      setForm({
        id: company.id,
        empresa: company.empresa,
        display_name: company.display_name || '',
        username: company.username,
        password: '',
        form_html: company.form_html || '',
        active: company.active,
      });
    } else {
      setForm(emptyForm);
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.empresa.trim() || !form.display_name.trim() || !form.username.trim()) {
      toast({ title: 'Preencha empresa, nome de exibição e usuário', variant: 'destructive' });
      return;
    }
    if (!form.id && !form.password.trim()) {
      toast({ title: 'Senha é obrigatória para uma empresa nova', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      await upsertSystemCompany({
        id: form.id,
        empresa: form.empresa.trim(),
        display_name: form.display_name.trim(),
        username: form.username.trim(),
        form_html: form.form_html.trim(),
        active: form.active,
        ...(form.password.trim() ? { password: form.password.trim() } : {}),
      });
      toast({ title: 'Empresa salva com sucesso' });
      setDialogOpen(false);
      loadCompanies();
    } catch (error) {
      toast({ title: 'Erro ao salvar empresa', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteSystemCompany(deleteTarget.id);
      toast({ title: 'Empresa removida' });
      setDeleteTarget(null);
      loadCompanies();
    } catch (error) {
      toast({ title: 'Erro ao remover empresa', variant: 'destructive' });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Empresas de Sistema (Token Alboom)</h1>
        <Button onClick={() => openEdit()}>Nova empresa</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Credenciais de sistema usadas para acesso cross-empresa</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome de exibição</TableHead>
                <TableHead>Empresa (slug)</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead>Token expira em</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {companies.map((company) => (
                <TableRow key={company.id}>
                  <TableCell>{company.display_name || <span className="text-muted-foreground">—</span>}</TableCell>
                  <TableCell>{company.empresa}</TableCell>
                  <TableCell>{company.username}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{company.expire_token}</TableCell>
                  <TableCell>
                    {company.active ? (
                      <Badge>Ativa</Badge>
                    ) : (
                      <Badge variant="outline">Inativa</Badge>
                    )}
                  </TableCell>
                  <TableCell className="space-x-2 text-right">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(company)}>
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeleteTarget(company)}
                    >
                      Remover
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {!loading && companies.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Nenhuma empresa cadastrada ainda.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form.id ? 'Editar empresa' : 'Nova empresa'}</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label>Nome de exibição</Label>
                <Input
                  className="mt-1"
                  value={form.display_name}
                  onChange={(e) => setForm((prev) => ({ ...prev, display_name: e.target.value }))}
                  placeholder="ex: Produtora 7"
                />
              </div>
              <div>
                <Label>Empresa (slug/subdomínio Alboom)</Label>
                <Input
                  className="mt-1"
                  value={form.empresa}
                  onChange={(e) => setForm((prev) => ({ ...prev, empresa: e.target.value }))}
                  placeholder="ex: produtora7"
                  disabled={!!form.id}
                />
              </div>
              <div>
                <Label>Usuário (email de login no Alboom)</Label>
                <Input
                  className="mt-1"
                  value={form.username}
                  onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))}
                />
              </div>
              <div className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <Label className="cursor-pointer" htmlFor="active-switch">Ativa neste sistema</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Controla se essa empresa aparece no login, no seletor de empresa e nas telas do
                    sistema financeiro. Desative pra empresas que usam a Alboom mas não este sistema
                    (a credencial continua na base, alimentando outros fluxos).
                  </p>
                </div>
                <Switch
                  id="active-switch"
                  checked={form.active}
                  onCheckedChange={(checked) => setForm((prev) => ({ ...prev, active: checked }))}
                />
              </div>
              <div>
                <Label>Senha {form.id && <span className="text-muted-foreground font-normal">(deixe em branco para manter a atual)</span>}</Label>
                <Input
                  className="mt-1"
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                  placeholder={form.id ? '••••••••' : ''}
                />
              </div>
              <div>
                <Label>
                  HTML do formulário de pagamento{' '}
                  <span className="text-muted-foreground font-normal">
                    (opcional — deixe em branco para usar o formulário padrão)
                  </span>
                </Label>
                <Textarea
                  className="mt-1 font-mono text-xs h-48"
                  value={form.form_html}
                  onChange={(e) => setForm((prev) => ({ ...prev, form_html: e.target.value }))}
                  placeholder="Cole aqui o HTML gerado por IA para o formulário desta empresa..."
                />
                <p className="text-xs text-muted-foreground mt-1">
                  O sistema injeta automaticamente <code>window.formContext</code> (from, name, email,
                  phoneNumberId, idUserRequester, tenantEmpresa) no HTML antes de exibi-lo.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Pré-visualização (formato mobile)</Label>
              <div className="border rounded-md bg-muted/30 p-3 flex justify-center">
                {form.form_html.trim() ? (
                  <iframe
                    title="Pré-visualização do formulário"
                    srcDoc={form.form_html}
                    sandbox=""
                    className="w-[375px] h-[667px] border rounded-md bg-white"
                  />
                ) : (
                  <div className="w-[375px] h-[667px] border rounded-md bg-white flex items-center justify-center text-sm text-muted-foreground">
                    Sem HTML customizado — o formulário padrão será usado
                  </div>
                )}
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

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover empresa?</AlertDialogTitle>
            <AlertDialogDescription>
              Isso apaga a credencial de sistema de <strong>{deleteTarget?.empresa}</strong>. Chamadas cross-empresa
              para essa empresa vão parar de funcionar até que ela seja recadastrada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Removendo...' : 'Remover'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

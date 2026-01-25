import { useState } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { useProducts, useCreateProduct, useUpdateProduct, useDeleteProduct } from '@/hooks/useAdminProducts';
import { useAdminEspacos } from '@/hooks/useAdminEspacos';
import { Plus, MoreVertical, Edit, Trash2, Loader2, Package } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ProductFormData {
  name: string;
  description: string;
  access_duration_days: number | null;
  price: number | null;
  is_active: boolean;
  espaco_ids: string[];
}

export default function AdminProducts() {
  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    access_duration_days: null,
    price: null,
    is_active: true,
    espaco_ids: []
  });

  const { data: products, isLoading } = useProducts();
  const { data: espacos } = useAdminEspacos();
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const deleteMutation = useDeleteProduct();

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      description: '',
      access_duration_days: null,
      price: null,
      is_active: true,
      espaco_ids: []
    });
    setFormOpen(true);
  };

  const handleOpenEdit = (product: any) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      access_duration_days: product.access_duration_days,
      price: product.price,
      is_active: product.is_active,
      espaco_ids: product.espacos?.map((e: any) => e.id) || []
    });
    setFormOpen(true);
  };

  const handleSubmit = () => {
    const data = {
      ...formData,
      access_duration_days: formData.access_duration_days || undefined,
      price: formData.price || undefined
    };

    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, ...data }, {
        onSuccess: () => setFormOpen(false)
      });
    } else {
      createMutation.mutate(data, {
        onSuccess: () => setFormOpen(false)
      });
    }
  };

  const toggleEspaco = (espacoId: string) => {
    setFormData(prev => ({
      ...prev,
      espaco_ids: prev.espaco_ids.includes(espacoId)
        ? prev.espaco_ids.filter(id => id !== espacoId)
        : [...prev.espaco_ids, espacoId]
    }));
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestão de Produtos</h1>
            <p className="text-muted-foreground">
              Gerencie pacotes de acesso e produtos
            </p>
          </div>
          <Button onClick={handleOpenCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Produto
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : products && products.length > 0 ? (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Turmas Incluídas</TableHead>
                  <TableHead>Duração</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Package className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{product.name}</p>
                          {product.description && (
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {product.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {product.espacos && product.espacos.length > 0 ? (
                          product.espacos.slice(0, 2).map((espaco) => (
                            <Badge key={espaco.id} variant="outline" className="text-xs">
                              {espaco.name}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground text-sm">Nenhuma</span>
                        )}
                        {product.espacos && product.espacos.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{product.espacos.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {product.access_duration_days
                        ? `${product.access_duration_days} dias`
                        : 'Vitalício'}
                    </TableCell>
                    <TableCell>
                      {product.price
                        ? `R$ ${product.price.toFixed(2)}`
                        : 'Grátis'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={product.is_active ? 'default' : 'secondary'}>
                        {product.is_active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleOpenEdit(product)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => deleteMutation.mutate(product.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">Nenhum produto cadastrado.</p>
              <Button onClick={handleOpenCreate}>
                Criar primeiro produto
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Product Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? 'Editar Produto' : 'Novo Produto'}
            </DialogTitle>
            <DialogDescription>
              {editingProduct
                ? 'Atualize as informações do produto.'
                : 'Preencha os dados para criar um novo produto.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Produto *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Pacote Completo 2024"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descrição do produto"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration">Duração do Acesso (dias)</Label>
                <Input
                  id="duration"
                  type="number"
                  min={0}
                  value={formData.access_duration_days || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    access_duration_days: e.target.value ? parseInt(e.target.value) : null
                  }))}
                  placeholder="Vazio = vitalício"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Preço (R$)</Label>
                <Input
                  id="price"
                  type="number"
                  min={0}
                  step="0.01"
                  value={formData.price || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    price: e.target.value ? parseFloat(e.target.value) : null
                  }))}
                  placeholder="Vazio = grátis"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
              />
              <Label htmlFor="active">Produto Ativo</Label>
            </div>

            <div className="space-y-2">
              <Label>Turmas Incluídas</Label>
              <div className="border rounded-md p-4 max-h-[200px] overflow-y-auto space-y-2">
                {espacos && espacos.length > 0 ? (
                  espacos.map((espaco) => (
                    <div key={espaco.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={espaco.id}
                        checked={formData.espaco_ids.includes(espaco.id)}
                        onCheckedChange={() => toggleEspaco(espaco.id)}
                      />
                      <label
                        htmlFor={espaco.id}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {espaco.name}
                      </label>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhuma turma disponível.</p>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!formData.name || createMutation.isPending || updateMutation.isPending}
            >
              {(createMutation.isPending || updateMutation.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {editingProduct ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

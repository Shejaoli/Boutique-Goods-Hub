import { useState } from "react";
import { Search, Plus, AlertTriangle, Package, TrendingDown, X } from "lucide-react";
import {
  useListProducts, useListCategories, useListSuppliers, useCreateProduct,
  useUpdateProduct, useDeleteProduct, useAdjustStock,
  getListProductsQueryKey, getListSuppliersQueryKey, getListCategoriesQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type Product = {
  id: number; name: string; description?: string | null; price: number;
  originalPrice?: number | null; categoryId?: number | null; categoryName?: string | null;
  unit: string; stockQuantity: number; minStockLevel: number; imageUrl?: string | null;
  supplierId?: number | null; supplierName?: string | null; status: string;
  rating?: number; reviewCount?: number; discountPercent?: number | null;
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  in_stock: { label: "In Stock", color: "bg-success/10 text-success" },
  low_stock: { label: "Low Stock", color: "bg-warning/10 text-warning" },
  out_of_stock: { label: "Out of Stock", color: "bg-destructive/10 text-destructive" },
};

const TABS = ["All", "In Stock", "Low Stock", "Out of Stock"];

export default function AdminProductsPage() {
  const { token } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("All");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState<Product | null>(null);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [stockAdjust, setStockAdjust] = useState({ quantity: 1, type: "import" as "import" | "export", note: "" });
  const [uploadingImage, setUploadingImage] = useState(false);

  const inStock = tab === "In Stock" ? "true" : undefined;
  const params: Record<string, unknown> = { search: search || undefined, limit: 100 };
  if (tab === "In Stock") params.inStock = "true";

  const listParams = { search: search || undefined, limit: 100 };
  const { data, isLoading } = useListProducts(listParams, { query: { enabled: !!token, queryKey: getListProductsQueryKey(listParams) } });
  const { data: categories } = useListCategories({ query: { queryKey: getListCategoriesQueryKey(), enabled: true } });
  const { data: suppliers } = useListSuppliers({ query: { enabled: !!token, queryKey: getListSuppliersQueryKey() } });
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const adjustStock = useAdjustStock();

  const allProducts = ((data as { products?: Product[] } | undefined)?.products ?? []) as Product[];
  const cats = (categories as { id: number; name: string }[] | undefined) ?? [];
  const supps = (suppliers as { id: number; name: string }[] | undefined) ?? [];

  const filtered = allProducts.filter(p => {
    if (tab === "In Stock") return p.status === "in_stock";
    if (tab === "Low Stock") return p.status === "low_stock";
    if (tab === "Out of Stock") return p.status === "out_of_stock";
    return true;
  });

  const inStockCount = allProducts.filter(p => p.status === "in_stock").length;
  const lowCount = allProducts.filter(p => p.status === "low_stock").length;
  const outCount = allProducts.filter(p => p.status === "out_of_stock").length;

  const emptyForm = { name: "", description: "", price: "", originalPrice: "", categoryId: "", unit: "1kg", stockQuantity: "0", minStockLevel: "10", imageUrl: "", supplierId: "", discountPercent: "" };
  const [form, setForm] = useState(emptyForm);

  const openAdd = () => { setForm(emptyForm); setEditProduct(null); setShowAddModal(true); };
  const openEdit = (p: Product) => {
    setForm({ name: p.name, description: p.description ?? "", price: String(p.price), originalPrice: String(p.originalPrice ?? ""), categoryId: String(p.categoryId ?? ""), unit: p.unit, stockQuantity: String(p.stockQuantity), minStockLevel: String(p.minStockLevel), imageUrl: p.imageUrl ?? "", supplierId: String(p.supplierId ?? ""), discountPercent: String(p.discountPercent ?? "") });
    setEditProduct(p);
    setShowAddModal(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;
    setUploadingImage(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/upload/image", { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd });
      const data = await res.json();
      setForm(f => ({ ...f, imageUrl: data.url }));
    } catch { toast({ title: "Image upload failed", variant: "destructive" }); }
    setUploadingImage(false);
  };

  const handleSave = () => {
    const payload = {
      name: form.name, description: form.description || null,
      price: parseFloat(form.price),
      originalPrice: form.originalPrice ? parseFloat(form.originalPrice) : null,
      categoryId: form.categoryId ? parseInt(form.categoryId) : null,
      unit: form.unit, stockQuantity: parseInt(form.stockQuantity), minStockLevel: parseInt(form.minStockLevel),
      imageUrl: form.imageUrl || null,
      supplierId: form.supplierId ? parseInt(form.supplierId) : null,
      discountPercent: form.discountPercent ? parseInt(form.discountPercent) : null,
    };
    if (editProduct) {
      updateProduct.mutate({ id: editProduct.id, data: payload } as Parameters<typeof updateProduct.mutate>[0], {
        onSuccess: () => { qc.invalidateQueries({ queryKey: getListProductsQueryKey({}) }); setShowAddModal(false); toast({ title: "Product updated" }); },
        onError: () => toast({ title: "Failed to update product", variant: "destructive" }),
      });
    } else {
      createProduct.mutate({ data: payload }, {
        onSuccess: () => { qc.invalidateQueries({ queryKey: getListProductsQueryKey({}) }); setShowAddModal(false); toast({ title: "Product created" }); },
        onError: () => toast({ title: "Failed to create product", variant: "destructive" }),
      });
    }
  };

  const handleDelete = (p: Product) => {
    if (!confirm(`Delete "${p.name}"?`)) return;
    deleteProduct.mutate({ id: p.id } as Parameters<typeof deleteProduct.mutate>[0], {
      onSuccess: () => { qc.invalidateQueries({ queryKey: getListProductsQueryKey({}) }); toast({ title: "Product deleted" }); },
    });
  };

  const handleStockAdjust = () => {
    if (!showStockModal) return;
    adjustStock.mutate({ id: showStockModal.id, data: stockAdjust } as Parameters<typeof adjustStock.mutate>[0], {
      onSuccess: () => { qc.invalidateQueries({ queryKey: getListProductsQueryKey({}) }); setShowStockModal(null); toast({ title: "Stock updated" }); },
      onError: () => toast({ title: "Failed to update stock", variant: "destructive" }),
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold">Inventory</h1>
          <p className="text-muted-foreground text-sm">{allProducts.length} products total</p>
        </div>
        <Button onClick={openAdd} className="bg-primary text-white rounded-xl gap-2">
          <Plus className="w-4 h-4" /> Add Product
        </Button>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total", value: allProducts.length, color: "text-foreground" },
          { label: "In Stock", value: inStockCount, color: "text-success" },
          { label: "Low Stock", value: lowCount, color: "text-warning" },
          { label: "Out of Stock", value: outCount, color: "text-destructive" },
        ].map(k => (
          <div key={k.label} className="bg-card rounded-xl p-3 border border-border text-center">
            <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
            <p className="text-xs text-muted-foreground">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Low stock banner */}
      {lowCount > 0 && (
        <div className="bg-warning/10 border border-warning/30 rounded-xl px-4 py-2.5 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0" />
          <p className="text-sm text-warning font-medium">{lowCount} product{lowCount !== 1 ? "s are" : " is"} running low on stock</p>
        </div>
      )}

      {/* Search + tabs */}
      <div className="flex gap-2 flex-col sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..." className="pl-9 rounded-xl" />
        </div>
      </div>
      <div className="flex gap-2 overflow-x-auto scrollbar-none">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${tab === t ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>{t}</button>
        ))}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
      ) : (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Product</th>
                  <th className="text-left px-3 py-3 text-xs font-semibold text-muted-foreground hidden md:table-cell">Category</th>
                  <th className="text-left px-3 py-3 text-xs font-semibold text-muted-foreground">Stock</th>
                  <th className="text-left px-3 py-3 text-xs font-semibold text-muted-foreground hidden sm:table-cell">Price</th>
                  <th className="text-left px-3 py-3 text-xs font-semibold text-muted-foreground">Status</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map(p => {
                  const cfg = STATUS_CONFIG[p.status] ?? { label: p.status, color: "bg-muted text-muted-foreground" };
                  const pct = Math.min(100, (p.stockQuantity / Math.max(p.minStockLevel * 2, 1)) * 100);
                  return (
                    <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-9 h-9 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                            {p.imageUrl ? <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" /> : (
                              <div className="w-full h-full flex items-center justify-center bg-primary/10"><span className="text-sm font-serif text-primary">{p.name[0]}</span></div>
                            )}
                          </div>
                          <div>
                            <p className="font-medium leading-tight">{p.name}</p>
                            <p className="text-xs text-muted-foreground">{p.unit}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-muted-foreground hidden md:table-cell">{p.categoryName ?? "—"}</td>
                      <td className="px-3 py-3">
                        <div>
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="font-medium">{p.stockQuantity}</span>
                            <span className="text-[10px] text-muted-foreground">Min:{p.minStockLevel}</span>
                          </div>
                          <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${p.status === "out_of_stock" ? "bg-destructive" : p.status === "low_stock" ? "bg-warning" : "bg-success"}`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 font-semibold hidden sm:table-cell">₦{p.price.toLocaleString()}</td>
                      <td className="px-3 py-3">
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${cfg.color}`}>{cfg.label}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => { setShowStockModal(p); setStockAdjust({ quantity: 1, type: "import", note: "" }); }} className="text-xs px-2.5 py-1 bg-muted rounded-lg hover:bg-muted/80 transition-all">Stock</button>
                          <button onClick={() => openEdit(p)} className="text-xs px-2.5 py-1 bg-muted rounded-lg hover:bg-muted/80 transition-all">Edit</button>
                          <button onClick={() => handleDelete(p)} className="text-xs px-2.5 py-1 bg-destructive/10 text-destructive rounded-lg hover:bg-destructive/20 transition-all">Del</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Package className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No products found</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif">{editProduct ? "Edit Product" : "Add Product"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div><Label className="text-xs">Name *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="mt-1 rounded-xl" /></div>
            <div><Label className="text-xs">Description</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="mt-1 rounded-xl resize-none" rows={2} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Price (₦) *</Label><Input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} className="mt-1 rounded-xl" /></div>
              <div><Label className="text-xs">Original Price (₦)</Label><Input type="number" value={form.originalPrice} onChange={e => setForm(f => ({ ...f, originalPrice: e.target.value }))} className="mt-1 rounded-xl" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Category</Label>
                <Select value={form.categoryId} onValueChange={v => setForm(f => ({ ...f, categoryId: v }))}>
                  <SelectTrigger className="mt-1 rounded-xl"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{cats.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">Unit</Label><Input value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} className="mt-1 rounded-xl" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Stock Quantity</Label><Input type="number" value={form.stockQuantity} onChange={e => setForm(f => ({ ...f, stockQuantity: e.target.value }))} className="mt-1 rounded-xl" /></div>
              <div><Label className="text-xs">Min Stock Level</Label><Input type="number" value={form.minStockLevel} onChange={e => setForm(f => ({ ...f, minStockLevel: e.target.value }))} className="mt-1 rounded-xl" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Supplier</Label>
                <Select value={form.supplierId} onValueChange={v => setForm(f => ({ ...f, supplierId: v }))}>
                  <SelectTrigger className="mt-1 rounded-xl"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{supps.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">Discount %</Label><Input type="number" value={form.discountPercent} onChange={e => setForm(f => ({ ...f, discountPercent: e.target.value }))} className="mt-1 rounded-xl" placeholder="e.g. 10" /></div>
            </div>
            <div>
              <Label className="text-xs">Product Image</Label>
              <div className="mt-1 flex gap-2">
                <Input value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))} placeholder="Image URL or upload below" className="rounded-xl flex-1" />
              </div>
              <label className="mt-2 flex items-center gap-2 text-xs text-primary cursor-pointer hover:underline">
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                {uploadingImage ? "Uploading..." : "Upload image file"}
              </label>
              {form.imageUrl && <img src={form.imageUrl} alt="Preview" className="mt-2 w-16 h-16 rounded-xl object-cover border border-border" />}
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setShowAddModal(false)}>Cancel</Button>
              <Button className="flex-1 bg-primary text-white rounded-xl" onClick={handleSave} disabled={createProduct.isPending || updateProduct.isPending}>
                {editProduct ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Stock adjust modal */}
      <Dialog open={!!showStockModal} onOpenChange={() => setShowStockModal(null)}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif">Adjust Stock — {showStockModal?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">Current stock: <span className="font-semibold text-foreground">{showStockModal?.stockQuantity}</span></p>
            <div>
              <Label className="text-xs">Type</Label>
              <Select value={stockAdjust.type} onValueChange={(v: "import" | "export") => setStockAdjust(a => ({ ...a, type: v }))}>
                <SelectTrigger className="mt-1 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="import">Import Stock (Add)</SelectItem>
                  <SelectItem value="export">Export Stock (Remove)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Quantity</Label><Input type="number" min={1} value={stockAdjust.quantity} onChange={e => setStockAdjust(a => ({ ...a, quantity: parseInt(e.target.value) || 1 }))} className="mt-1 rounded-xl" /></div>
            <div><Label className="text-xs">Note</Label><Input value={stockAdjust.note} onChange={e => setStockAdjust(a => ({ ...a, note: e.target.value }))} className="mt-1 rounded-xl" placeholder="Optional note" /></div>
            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setShowStockModal(null)}>Cancel</Button>
              <Button className="flex-1 bg-primary text-white rounded-xl" onClick={handleStockAdjust} disabled={adjustStock.isPending}>Update Stock</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

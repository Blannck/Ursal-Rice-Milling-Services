"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { MoreHorizontal, Edit3, Trash2, Plus, Search } from "lucide-react";

type Supplier = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  note?: string | null;
  isActive: boolean;
  createdAt: string;
};

type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  supplierId?: string | null;
  supplier?: {
    name: string;
  } | null;
};

export default function SuppliersClient({ initialData }: { initialData: Supplier[] }) {
  const router = useRouter();

  // table state
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(1);

  // form state (create + edit)
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);

  // product selection state
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [loadingProducts, setLoadingProducts] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let out = initialData.filter((s) => {
      const hay = `${s.name} ${s.email ?? ""} ${s.phone ?? ""}`.toLowerCase();
      return !q || hay.includes(q);
    });
    if (status !== "all") out = out.filter((s) => (status === "active" ? s.isActive : !s.isActive));
    return out.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [initialData, query, status]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const paged = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  // Filter products based on search
  const filteredProducts = useMemo(() => {
    const searchTerm = productSearch.toLowerCase();
    return products.filter(product => 
      product.name.toLowerCase().includes(searchTerm) ||
      product.category.toLowerCase().includes(searchTerm)
    );
  }, [products, productSearch]);

  // Fetch products when modal opens
  useEffect(() => {
    if (open && products.length === 0) {
      fetchProducts();
    }
  }, [open]);

  async function fetchProducts() {
    setLoadingProducts(true);
    try {
      const res = await fetch("/api/admin/products");
      const data = await res.json();
      if (res.ok && data.success) {
        setProducts(data.products);
      }
    } catch (error) {
      console.error("Failed to fetch products:", error);
    } finally {
      setLoadingProducts(false);
    }
  }

  // actions
  function startCreate() {
    setEditing({
      id: "",
      name: "",
      email: "",
      phone: "",
      address: "",
      note: "",
      isActive: true,
      createdAt: new Date().toISOString(),
    });
    setSelectedProducts([]);
    setProductSearch("");
    setOpen(true);
  }

  async function startEdit(s: Supplier) {
    setEditing(s);
    setSelectedProducts([]);
    setProductSearch("");
    
    // Fetch current supplier details including associated products
    try {
      const res = await fetch(`/api/admin/suppliers/${s.id}`);
      const data = await res.json();
      if (res.ok && data.ok && data.data.products) {
        // Set currently associated products as selected
        const currentProductIds = data.data.products.map((p: Product) => p.id);
        setSelectedProducts(currentProductIds);
      }
    } catch (error) {
      console.error("Failed to fetch supplier details:", error);
    }
    
    setOpen(true);
  }

  function toggleProduct(productId: string) {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  }

  async function save() {
    if (!editing) return;
    const payload = {
      name: editing.name,
      email: editing.email,
      phone: editing.phone,
      address: editing.address,
      note: editing.note,
      isActive: editing.isActive,
      productIds: selectedProducts, // Include selected products
    };

    if (!editing.id) {
      const res = await fetch("/api/admin/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await res.json();
      if (!res.ok || !j.ok) return alert(j.error || "Create failed");
    } else {
      const res = await fetch(`/api/admin/suppliers/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await res.json();
      if (!res.ok || !j.ok) return alert(j.error || "Update failed");
    }
    setOpen(false);
    router.refresh(); // quick refetch
  }

  async function remove(id: string) {
    if (!confirm("Delete this supplier?")) return;
    const res = await fetch(`/api/admin/suppliers/${id}`, { method: "DELETE" });
    const j = await res.json().catch(() => ({}));
    if (!res.ok || !j.ok) return alert(j.error || "Delete failed");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-full max-w-sm">
          <Input placeholder="Search suppliers" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <Select value={status} onValueChange={(v) => { setPage(1); setStatus(v); }}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>

        <div className="ml-auto flex items-center gap-2">
          <Button onClick={startCreate}>
            <Plus className="h-4 w-4 mr-2" />
            New Supplier
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border bg-custom-white text-black shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-custom-white ">
              <TableHead className="text-black">Name</TableHead>
              <TableHead className="text-black">Email</TableHead>
              <TableHead className="text-black">Phone</TableHead>
              <TableHead className="text-black">Status</TableHead>
              <TableHead className="text-black text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.map((s) => {
              const statusBadge = s.isActive ? <Badge>Active</Badge> : <Badge variant="secondary">Inactive</Badge>;
              return (
                <TableRow
                  key={s.id}
                  className="cursor-pointer hover:bg-gray-900/60"
                  onClick={() => router.push(`/admin/suppliers/${s.id}`)}
                >
                  <TableCell>{s.name}</TableCell>
                  <TableCell>{s.email || "—"}</TableCell>
                  <TableCell>{s.phone || "—"}</TableCell>
                  <TableCell>{statusBadge}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Manage</DropdownMenuLabel>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); startEdit(s); }}>
                            <Edit3 className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); remove(s.id); }}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {paged.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-gray-400">
                  No suppliers found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
          Prev
        </Button>
        <span className="text-sm text-muted-foreground">{page} / {totalPages}</span>
        <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
          Next
        </Button>
      </div>

      {/* Modal Form — create + edit */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Edit Supplier" : "New Supplier"}</DialogTitle>
          </DialogHeader>

          {editing && (
            <div className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label>Email</Label>
                  <Input value={editing.email || ""} onChange={(e) => setEditing({ ...editing, email: e.target.value })} />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input 
                    type="tel"
                    value={editing.phone || ""} 
                    onChange={(e) => {
                      // Only allow numbers, spaces, hyphens, parentheses, and plus sign
                      const value = e.target.value.replace(/[^0-9\s\-\(\)\+]/g, '');
                      setEditing({ ...editing, phone: value });
                    }}
                    onKeyPress={(e) => {
                      // Prevent non-numeric characters from being typed (except allowed special chars)
                      if (!/[0-9\s\-\(\)\+]/.test(e.key) && !['Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                        e.preventDefault();
                      }
                    }}
                  />
                </div>
              </div>
              <div>
                <Label>Address</Label>
                <Input value={editing.address || ""} onChange={(e) => setEditing({ ...editing, address: e.target.value })} />
              </div>
              <div>
                <Label>Note</Label>
                <Textarea value={editing.note || ""} onChange={(e) => setEditing({ ...editing, note: e.target.value })} />
              </div>
              <div className="flex items-center gap-2 pt-1">
                <Switch checked={!!editing.isActive} onCheckedChange={(v) => setEditing({ ...editing, isActive: v })} />
                <Label>Active</Label>
              </div>

              {/* Product Selection Section */}
              <div className="space-y-3 border-t pt-4">
                <div>
                  <Label className="text-base font-medium">Associate Products</Label>
                  <p className="text-sm text-muted-foreground">Select products to associate with this supplier</p>
                </div>
                
                {/* Product Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search products..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Product List */}
                <div className="max-h-40 overflow-y-auto border rounded-md">
                  {loadingProducts ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      Loading products...
                    </div>
                  ) : filteredProducts.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      {productSearch ? "No products found" : "No products available"}
                    </div>
                  ) : (
                    filteredProducts.map((product) => {
                      const isSelected = selectedProducts.includes(product.id);
                      const hasOtherSupplier = product.supplierId && product.supplierId !== editing?.id;
                      
                      return (
                        <div key={product.id} className="flex items-center space-x-3 p-3 hover:bg-gray-600 border-b last:border-b-0">
                          <Checkbox
                            id={`product-${product.id}`}
                            checked={isSelected}
                            onCheckedChange={() => toggleProduct(product.id)}
                          />
                          <div className="flex-1">
                            <div className="font-medium text-sm">{product.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {product.category} • ₱{product.price.toFixed(2)}
                              {hasOtherSupplier && product.supplier?.name && (
                                <span className="ml-2 text-blue-600">
                                </span>
                              )}
                              {isSelected && editing?.id && (
                                <span className="ml-2 text-green-600">
                                  • Will be associated
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Selected Products Summary */}
                {selectedProducts.length > 0 && (
                  <div className="text-sm">
                    <div className="font-medium text-green-600 mb-2">
                      {selectedProducts.length} product{selectedProducts.length === 1 ? '' : 's'} selected
                    </div>
                    {editing?.id && (
                      <div className="text-xs text-muted-foreground">
                        Changes will be saved when you click "Save changes"
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save}>{editing?.id ? "Save changes" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}